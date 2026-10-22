const fs = require("fs/promises");
const path = require("path");
const Dataset = require("../models/Dataset");
const { parseDataset } = require("../services/file/datasetParser");

const uploadDataset = async (req, res) => {
  let uploadedFilePath;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a dataset file.",
      });
    }

    uploadedFilePath = req.file.path;

    // Assumes your protect middleware sets req.user.
    const managerId = req.user?._id || req.user?.id;

    if (!managerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required.",
      });
    }

    const parsedData = parseDataset(uploadedFilePath);

    const extension = path.extname(req.file.originalname).toLowerCase();

    const fileType = extension.slice(1);

    const dataset = await Dataset.create({
      name:
        req.body.name?.trim() ||
        path.basename(req.file.originalname, extension),
      originalFileName: req.file.originalname,
      fileType,
      fileSize: req.file.size,
      uploadedBy: req.user._id,
      institutionName: req.user.institutionName || "",
      totalRows: parsedData.totalRows,
      columns: parsedData.columns,
      records: parsedData.records,
      status: "validated",
    });

    return res.status(201).json({
      success: true,
      message: "Dataset uploaded and validated successfully.",
      dataset: {
        _id: dataset._id,
        name: dataset.name,
        originalFileName: dataset.originalFileName,
        fileType: dataset.fileType,
        fileSize: dataset.fileSize,
        totalRows: dataset.totalRows,
        columns: dataset.columns,
        status: dataset.status,
        createdAt: dataset.createdAt,
      },
    });
  } catch (error) {
    console.error("Dataset upload failed:", error.message);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to process the uploaded dataset.",
    });
  } finally {
    if (uploadedFilePath) {
      await fs.unlink(uploadedFilePath).catch(() => {});
    }
  }
};

const getMyDatasets = async (req, res) => {
  try {
    const datasets = await Dataset.find({
      uploadedBy: req.user._id,
    })
      .select("-records")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: datasets.length,
      datasets,
    });
  } catch (error) {
    console.error("Fetching datasets failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch datasets.",
    });
  }
};

module.exports = {
  uploadDataset,
  getMyDatasets,
};
