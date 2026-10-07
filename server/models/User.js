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
      enum: ["admin", "manager"],
      default: "manager",
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
  }
);

module.exports = mongoose.model("User", userSchema);