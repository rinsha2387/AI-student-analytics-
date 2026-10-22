const mongoose = require("mongoose");

const outputSections = [
  "executiveSummary",
  "studentsRequiringReview",
  "academicInsights",
  "attendanceInsights",
  "behavioralInsights",
  "financialImpact",
  "dataQualityObservations",
  "supportingIndicators",
  "managementReviewSuggestions",
];

const aiPromptSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "Student Analytics Master Prompt",
      trim: true,
    },
    description: {
      type: String,
      default: "Analyze student academic and attendance data.",
    },
    systemInstruction: {
      type: String,
      required: true,
      trim: true,
    },
    version: {
      type: String,
      default: "v1.0",
    },
    status: {
      type: String,
      enum: ["active", "inactive","draft"],
      default: "active",
    },
    outputSections: {
      type: [String],
      enum: outputSections,
      default: outputSections,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AIPrompt", aiPromptSchema);