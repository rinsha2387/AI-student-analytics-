const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    role: {
      type: String,
      enum: ["admin", "manager", "sales"],
      default: "manager",
    },

    // active   = can use the app
    // pending  = waiting for the manager to accept
    // rejected = manager rejected the request
    status: {
      type: String,
      enum: ["active", "pending", "rejected"],
      default: "active",
    },

    institution: {
      name: {
        type: String,
        required: function () {
          return this.role === "manager";
        },
        trim: true,
      },

      city: {
        type: String,
        required: function () {
          return this.role === "manager";
        },
        trim: true,
      },
    },

    notificationPreferences: {
      analysisFailures: { type: Boolean, default: true },
      newUserRequests: { type: Boolean, default: true },
      weeklySummary: { type: Boolean, default: false },
      systemAlerts: { type: Boolean, default: true },
      analysisCompleted: { type: Boolean, default: true },
      reportReady: { type: Boolean, default: true },
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
