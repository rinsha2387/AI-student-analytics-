const mongoose = require("mongoose");

// Only one AI configuration document is used for the whole system.
// The provider is always Google Gemini. The API key stays in the .env file
// and is never saved in the database.
const aiConfigSchema = new mongoose.Schema(
  {
    // Empty means "use GEMINI_MODEL from the .env file".
    model: { type: String, trim: true, default: "" },
    temperature: { type: Number, min: 0, max: 2, default: 0.2 },
    maxOutputTokens: { type: Number, min: 1, max: 100000, default: 4096 },
    responseFormat: {
      type: String,
      enum: ["json", "text"],
      default: "json",
    },
    timeoutSeconds: { type: Number, min: 10, max: 600, default: 120 },
    retryAttempts: { type: Number, min: 0, max: 10, default: 3 },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

// Third argument sets the collection name to "aiconfigurations".
module.exports = mongoose.model("AIConfig", aiConfigSchema, "aiconfigurations");