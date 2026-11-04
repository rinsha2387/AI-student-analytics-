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

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);