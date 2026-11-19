const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    userName: { type: String, trim: true, default: "System" },
    email: { type: String, trim: true, default: "" },
    role: { type: String, trim: true, default: "" },

    activity: { type: String, trim: true, default: "System event" },
    action: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    event: { type: String, trim: true, default: "" },

    resourceName: { type: String, trim: true, default: "—" },
    datasetName: { type: String, trim: true, default: "" },
    resource: { type: String, trim: true, default: "—" },

    // NEW: used for the filter tabs on the System Logs page
    category: {
      type: String,
      enum: ["auth", "user", "data", "analysis", "settings", "system"],
      default: "system",
      index: true,
    },

    // NEW: where the action came from
    ipAddress: { type: String, trim: true, default: "" },
    userAgent: { type: String, trim: true, default: "" },

    status: {
      type: String,
      enum: ["success", "failed", "completed", "processing", "pending"],
      default: "success",
    },
    category: {
      type: String,
      trim: true,
      default: "general",
    },
    success: { type: Boolean, default: true },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
