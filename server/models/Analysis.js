const mongoose = require("mongoose");

const analysisSchema = new mongoose.Schema(
  {
    dataset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dataset",
      required: true,
      index: true,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    prompt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AIPrompt",
      default: null,
    },
    promptVersion: {
      type: String,
      default: "v1.0",
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

analysisSchema.index({ manager: 1, createdAt: -1 });
analysisSchema.index({ dataset: 1, createdAt: -1 });

module.exports = mongoose.model("Analysis", analysisSchema);