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
  supportedFields: "Attendance, Marks, Assignments, Fees",
};

const parseList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return typeof value === "string"
    ? value.split(",").map((item) => item.trim()).filter(Boolean)
    : [];
};

const normalizeColumn = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const getConfig = async () => {
  const savedConfig = await AnalysisConfig.findOne().lean();
  return { ...DEFAULTS, ...(savedConfig || {}) };
};

const sendValidationFailure = (res, validationErrors) =>
  res.status(400).json({
    success: false,
    message: "Dataset validation failed. Please correct the file and upload it again.",
    validationErrors,
  });

const validateNumericFields = (columns, records) => {
  const errors = [];
  const numericFieldPattern =
    /(mark|score|attendancepercentage|attendancepercent|assignment|feesdue|feespaid|feeamount|totalfees|amountpaid|amountdue)/;

  const percentagePattern = /(attendancepercentage|attendancepercent)/;
  const maxReportedErrors = 20;

  columns.forEach((column) => {
    const normalized = normalizeColumn(column);

    if (!numericFieldPattern.test(normalized)) {
      return;
    }

    records.forEach((record, index) => {
      if (errors.length >= maxReportedErrors) return;

      const rawValue = record[column];

      // Blank optional values are not treated as zero.
      if (rawValue === "" || rawValue === null || rawValue === undefined) {
        return;
      }

      const value =
        typeof rawValue === "number"
          ? rawValue
          : Number(String(rawValue).replace(/,/g, "").trim());

      if (!Number.isFinite(value)) {
        errors.push(
          `Row ${index + 2}: "${column}" must contain a valid number.`
        );
        return;
      }

      if (value < 0) {
        errors.push(
          `Row ${index + 2}: "${column}" cannot be negative.`
        );
        return;
      }

      if (percentagePattern.test(normalized) && value > 100) {
        errors.push(
          `Row ${index + 2}: "${column}" must be between 0 and 100.`
        );
      }
    });
  });

  return errors;
};

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

    const config = await getConfig();
    const validationErrors = [];

    const extension = path.extname(req.file.originalname).toLowerCase();
    const fileType = extension.replace(".", "").toUpperCase();

    const allowedFileTypes = parseList(config.allowedFileTypes).map(
      (type) => type.replace(/^\./, "").toUpperCase()
    );

    // 1. Validate file type.
    if (!allowedFileTypes.includes(fileType)) {
      validationErrors.push(
        `File type "${fileType || "unknown"}" is not allowed. Allowed types: ${allowedFileTypes.join(", ")}.`
      );
    }

    // 2. Validate file size.
    const maxFileSizeMB = Number(config.maxFileSizeMB);

    if (!Number.isFinite(maxFileSizeMB) || maxFileSizeMB <= 0) {
      console.error("Invalid maxFileSizeMB in Analysis Configuration.");
      return res.status(500).json({
        success: false,
        message: "The administrator's maximum file size configuration is invalid.",
      });
    }

    const maxBytes = maxFileSizeMB * 1024 * 1024;

    if (req.file.size === 0) {
      validationErrors.push("The selected file is empty.");
    } else if (req.file.size > maxBytes) {
      validationErrors.push(
        `File size exceeds the configured limit of ${maxFileSizeMB} MB.`
      );
    }

    if (validationErrors.length) {
      return sendValidationFailure(res, validationErrors);
    }

    // 3. Parse the file before saving anything to the Dataset collection.
    let parsedData;

    try {
      parsedData = await parseDataset(uploadedFilePath);
    } catch (parseError) {
      return sendValidationFailure(res, [
        parseError.message || "The uploaded file could not be parsed.",
      ]);
    }

    if (
      !parsedData ||
      !Array.isArray(parsedData.columns) ||
      !Array.isArray(parsedData.records)
    ) {
      return sendValidationFailure(res, [
        "The uploaded file could not be parsed into student records.",
      ]);
    }

    const { columns, records } = parsedData;
    const totalRows = records.length;

    // 4. Validate the number of records.
    if (totalRows === 0) {
      validationErrors.push(
        "The uploaded dataset does not contain any student records."
      );
    }

    const maxRows = Number(config.maxRows);

    if (!Number.isFinite(maxRows) || maxRows <= 0) {
      console.error("Invalid maxRows in Analysis Configuration.");
      return res.status(500).json({
        success: false,
        message: "The administrator's maximum row configuration is invalid.",
      });
    }

    if (totalRows > maxRows) {
      validationErrors.push(
        `The dataset contains ${totalRows} student rows. The configured maximum is ${maxRows}.`
      );
    }

    // 5. Validate required columns.
    const columnMap = new Map(
      columns.map((column) => [normalizeColumn(column), column])
    );

    const requiredFields = parseList(config.requiredFields);

    if (requiredFields.length === 0) {
      validationErrors.push(
        "No required fields are configured. Ask the administrator to configure at least one required field."
      );
    }

    const matchedRequiredFields = [];

    for (const field of requiredFields) {
      const actualColumn = columnMap.get(normalizeColumn(field));

      if (!actualColumn) {
        validationErrors.push(
          `Required column "${field}" is missing from the uploaded dataset.`
        );
      } else {
        matchedRequiredFields.push({
          configuredName: field,
          actualColumn,
        });
      }
    }

    // 6. Validate values in every required field.
    const maxReportedErrors = 20;

    for (const { configuredName, actualColumn } of matchedRequiredFields) {
      records.forEach((record, index) => {
        if (validationErrors.length >= maxReportedErrors) return;

        const value = record[actualColumn];

        if (
          value === null ||
          value === undefined ||
          String(value).trim() === ""
        ) {
          validationErrors.push(
            `Row ${index + 2}: required field "${configuredName}" is empty.`
          );
        }
      });

      if (validationErrors.length >= maxReportedErrors) break;
    }

    // 7. Validate numeric values in recognizable analytics fields.
    if (validationErrors.length < maxReportedErrors) {
      const numericErrors = validateNumericFields(columns, records);
      validationErrors.push(
        ...numericErrors.slice(0, maxReportedErrors - validationErrors.length)
      );
    }

    // Do not create a MongoDB Dataset document if any check failed.
    if (validationErrors.length) {
      return sendValidationFailure(res, validationErrors);
    }

    // 8. Save only after all configured and data-level checks pass.
    const dataset = await Dataset.create({
      name:
        req.body.name?.trim() ||
        path.basename(req.file.originalname, extension),
      originalFileName: req.file.originalname,
      fileType: extension.slice(1).toLowerCase(),
      fileSize: req.file.size,
      uploadedBy: managerId,
      institutionName: req.user?.institutionName || "",
      totalRows,
      columns,
      records,
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
    console.error("Dataset upload failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process the uploaded dataset.",
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

    const datasets = await Dataset.find({ uploadedBy: managerId })
      .select("-records")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: datasets.length,
      datasets,
    });
  } catch (error) {
    console.error("Fetching datasets failed:", error);

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