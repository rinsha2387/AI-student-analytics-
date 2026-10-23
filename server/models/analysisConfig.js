
const mongoose = require("mongoose");

const analysisConfigSchema = new mongoose.Schema(
  {
    maxFileSizeMB: {
      type: Number,
      default: 25,
      min: 1,
      max: 500,
    },

    allowedFileTypes: {
      type: String,
      default: "CSV, XLSX, XLS",
      trim: true,
    },

    maxRows: {
      type: Number,
      default: 50000,
      min: 1,
      max: 1000000,
    },

    requiredFields: {
      type: String,
      default: "Student ID",
      trim: true,
    },

    supportedFields: {
      type: String,
      default: "Attendance, Marks, Assignments, Fees",
      trim: true,
    },

    timeoutSeconds: {
      type: Number,
      default: 120,
      min: 10,
      max: 600,
    },

    reportFormats: {
      type: String,
      default: "CSV, PDF",
      trim: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "AnalysisConfig",
  analysisConfigSchema
);
