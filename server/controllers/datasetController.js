
const fs = require("fs/promises");
const path = require("path");

const Dataset = require("../models/Dataset");
const AnalysisConfig = require("../models/analysisConfig");
const { parseDataset } = require("../services/file/datasetParser");

const DEFAULTS = {
  maxFileSizeMB: 25,
  allowedFileTypes: "CSV, XLSX, XLS",
  maxRows: 50000,
  requiredFields: "Student ID",
};

const parseList = (value) =>
  typeof value === "string"
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

const normalizeColumn = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

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

    const managerId = req.user?._id || req.user?.id;

    if (!managerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required.",
      });
    }

    // Load the settings saved by the administrator.
    const savedConfig = await AnalysisConfig.findOne().lean();
    const config = { ...DEFAULTS, ...(savedConfig || {}) };

    const extension = path
      .extname(req.file.originalname)
      .toLowerCase();

    const fileType = extension.slice(1).toUpperCase();

    const allowedFileTypes = parseList(
      config.allowedFileTypes
    ).map((type) => type.toUpperCase());

    // Validate the file extension.
    if (!allowedFileTypes.includes(fileType)) {
      return res.status(400).json({
        success: false,
        message: `File type ${fileType || "unknown"} is not allowed. Allowed types: ${allowedFileTypes.join(", ")}.`,
      });
    }

    // Validate file size using the administrator's setting.
    const maxBytes = Number(config.maxFileSizeMB) * 1024 * 1024;

    if (req.file.size > maxBytes) {
      return res.status(400).json({
        success: false,
        message: `File size exceeds the configured limit of ${config.maxFileSizeMB} MB.`,
      });
    }

    if (req.file.size === 0) {
      return res.status(400).json({
        success: false,
        message: "The selected file is empty.",
      });
    }

    // Parse the uploaded file.
    const parsedData = await parseDataset(uploadedFilePath);

    if (
      !parsedData ||
      !Array.isArray(parsedData.columns) ||
      !Array.isArray(parsedData.records)
    ) {
      return res.status(400).json({
        success: false,
        message: "The uploaded file could not be parsed into student records.",
      });
    }

    const totalRows = parsedData.totalRows ?? parsedData.records.length;
    const validationErrors = [];

    // Validate the number of student rows.
    if (totalRows === 0 || parsedData.records.length === 0) {
      validationErrors.push(
        "The uploaded dataset does not contain any student records."
      );
    }

    if (totalRows > Number(config.maxRows)) {
      validationErrors.push(
        `The dataset contains ${totalRows} rows. The configured maximum is ${config.maxRows}.`
      );
    }

    // Validate required column names.
    const availableColumns = new Set(
      parsedData.columns.map(normalizeColumn)
    );

    const requiredFields = parseList(config.requiredFields);

    for (const field of requiredFields) {
      if (!availableColumns.has(normalizeColumn(field))) {
        validationErrors.push(
          `Required column "${field}" is missing from the uploaded dataset.`
        );
      }
    }

    // Do not save an invalid dataset as validated.
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Dataset validation failed. Please correct the file and upload it again.",
        validationErrors,
      });
    }

    const dataset = await Dataset.create({
      name:
        req.body.name?.trim() ||
        path.basename(req.file.originalname, extension),
      originalFileName: req.file.originalname,
      fileType: extension.slice(1),
      fileSize: req.file.size,
      uploadedBy: managerId,
      institutionName: req.user?.institutionName || "",
      totalRows,
      columns: parsedData.columns,
      records: parsedData.records,
      status: "validated",
      validationErrors: [],
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
    const managerId = req.user?._id || req.user?.id;

    if (!managerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required.",
      });
    }

    const datasets = await Dataset.find({
      uploadedBy: managerId,
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