const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const AnalysisConfig = require("../models/analysisConfig");

const uploadDirectory = path.join(__dirname, "../uploads");

fs.mkdirSync(uploadDirectory, { recursive: true });

const DEFAULTS = {
  maxFileSizeMB: 25,
  allowedFileTypes: "CSV, XLSX, XLS",
};

const parseList = (value) =>
  typeof value === "string"
    ? value
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
    : [];

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDirectory);
  },

  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();

    callback(
      null,
      `${Date.now()}-${crypto.randomUUID()}${extension}`
    );
  },
});

// Load the current administrator configuration before Multer processes
// the file, so both file type and size follow the saved settings.
const uploadWithConfig = async (req, res, next) => {
  try {
    const savedConfig = await AnalysisConfig.findOne().lean();
    const config = { ...DEFAULTS, ...(savedConfig || {}) };

    const allowedExtensions = parseList(config.allowedFileTypes).map(
      (type) => (type.startsWith(".") ? type : `.${type}`)
    );

    const maxFileSizeMB = Number(config.maxFileSizeMB);

    if (!Number.isFinite(maxFileSizeMB) || maxFileSizeMB <= 0) {
      return res.status(500).json({
        success: false,
        message: "The configured maximum file size is invalid.",
      });
    }

    const upload = multer({
      storage,

      fileFilter: (fileReq, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();

        if (!allowedExtensions.includes(extension)) {
          return callback(
            new Error(
              `File type not allowed. Accepted types: ${allowedExtensions.join(", ")}.`
            )
          );
        }

        callback(null, true);
      },

      limits: {
        fileSize: maxFileSizeMB * 1024 * 1024,
        files: 1,
      },
    }).single("file");

    upload(req, res, (error) => {
      if (error) {
        if (error instanceof multer.MulterError) {
          const message =
            error.code === "LIMIT_FILE_SIZE"
              ? `File exceeds the configured maximum size of ${maxFileSizeMB} MB.`
              : error.message;

          return res.status(400).json({
            success: false,
            message,
          });
        }

        return res.status(400).json({
          success: false,
          message: error.message || "File upload failed.",
        });
      }

      next();
    });
  } catch (error) {
    console.error("Upload configuration error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load upload configuration.",
    });
  }
};

module.exports = uploadWithConfig;
