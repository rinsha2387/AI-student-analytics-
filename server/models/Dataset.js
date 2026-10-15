
const mongoose = require("mongoose");

const datasetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    originalFileName: {
      type: String,
      required: true,
    },

    fileType: {
      type: String,
      enum: ["csv", "xlsx", "xls"],
      required: true,
    },

    fileSize: {
      type: Number,
      required: true,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    institutionName: {
      type: String,
      trim: true,
      default: "",
    },

    totalRows: {
      type: Number,
      default: 0,
    },

    columns: {
      type: [String],
      default: [],
    },

    records: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },

    status: {
      type: String,
      enum: ["uploaded", "validated", "failed"],
      default: "uploaded",
    },

    validationErrors: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Dataset", datasetSchema);
