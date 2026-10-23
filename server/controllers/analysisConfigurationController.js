const AnalysisConfig = require("../models/analysisConfig");

const DEFAULTS = {
  maxFileSizeMB: 25,
  allowedFileTypes: "CSV, XLSX, XLS",
  maxRows: 50000,
  requiredFields: "Student ID",
  supportedFields: "Attendance, Marks, Assignments, Fees",
  timeoutSeconds: 120,
  reportFormats: "CSV, PDF",
};

const ALLOWED_FILE_TYPES = ["CSV", "XLSX", "XLS"];
const ALLOWED_REPORT_FORMATS = ["CSV", "PDF"];

const toResponse = (config) => {
  const source = config || DEFAULTS;

  return {
    maxFileSizeMB: source.maxFileSizeMB,
    allowedFileTypes: source.allowedFileTypes,
    maxRows: source.maxRows,
    requiredFields: source.requiredFields,
    supportedFields: source.supportedFields,
    timeoutSeconds: source.timeoutSeconds,
    reportFormats: source.reportFormats,
    updatedAt: config?.updatedAt || null,
  };
};

const parseList = (value) =>
  typeof value === "string"
    ? value
        .split(",")
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean)
    : [];

const isValidList = (value, allowedValues) => {
  const items = parseList(value);

  return (
    items.length > 0 &&
    new Set(items).size === items.length &&
    items.every((item) => allowedValues.includes(item))
  );
};

const getConfig = async (req, res) => {
  try {
    const config = await AnalysisConfig.findOne();

    return res.json({
      success: true,
      config: toResponse(config),
    });
  } catch (error) {
    console.error("get AnalysisConfig error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to load analysis configuration.",
    });
  }
};

const saveConfig = async (req, res) => {
  try {
    const {
      maxFileSizeMB,
      allowedFileTypes,
      maxRows,
      requiredFields,
      supportedFields,
      timeoutSeconds,
      reportFormats,
    } = req.body;

    const fileSize = Number(maxFileSizeMB);
    const rows = Number(maxRows);
    const timeout = Number(timeoutSeconds);

    if (
      !Number.isFinite(fileSize) ||
      fileSize < 1 ||
      fileSize > 500
    ) {
      return res.status(400).json({
        success: false,
        message: "Maximum file size must be between 1 and 500 MB.",
      });
    }

    if (
      !Number.isInteger(rows) ||
      rows < 1 ||
      rows > 1000000
    ) {
      return res.status(400).json({
        success: false,
        message: "Maximum rows must be between 1 and 1,000,000.",
      });
    }

    if (
      !Number.isInteger(timeout) ||
      timeout < 10 ||
      timeout > 600
    ) {
      return res.status(400).json({
        success: false,
        message: "Analysis timeout must be between 10 and 600 seconds.",
      });
    }

    if (!isValidList(allowedFileTypes, ALLOWED_FILE_TYPES)) {
      return res.status(400).json({
        success: false,
        message: "Allowed file types must contain CSV, XLSX, or XLS.",
      });
    }

    if (!isValidList(reportFormats, ALLOWED_REPORT_FORMATS)) {
      return res.status(400).json({
        success: false,
        message: "Report formats must contain CSV or PDF.",
      });
    }

    if (
      typeof requiredFields !== "string" ||
      !requiredFields.trim() ||
      typeof supportedFields !== "string" ||
      !supportedFields.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Required fields and supported data fields cannot be empty.",
      });
    }

    let config = await AnalysisConfig.findOne();

    if (!config) {
      config = new AnalysisConfig();
    }

    config.maxFileSizeMB = fileSize;
    config.allowedFileTypes = parseList(allowedFileTypes).join(", ");
    config.maxRows = rows;
    config.requiredFields = requiredFields.trim();
    config.supportedFields = supportedFields.trim();
    config.timeoutSeconds = timeout;
    config.reportFormats = parseList(reportFormats).join(", ");

    if (req.user?._id) {
      config.updatedBy = req.user._id;
    }

    await config.save();

    return res.json({
      success: true,
      message: "Analysis configuration saved successfully.",
      config: toResponse(config),
    });
  } catch (error) {
    console.error("save AnalysisConfig error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to save analysis configuration.",
    });
  }
};

module.exports = {
  getConfig,
  saveConfig,
};
