const AIConfig = require("../models/AIConfig");

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const FORMATS = ["json", "text"];

const DEFAULTS = {
  model: "",
  temperature: 0.2,
  maxOutputTokens: 4096,
  responseFormat: "json",
  timeoutSeconds: 120,
  retryAttempts: 3,
};

// Read from .env at request time (dotenv is loaded in server.js).
const getEnvApiKey = () => (process.env.GEMINI_API_KEY || "").trim();
const getEnvModel = () => (process.env.GEMINI_MODEL || "").trim();

const cleanModelName = (name) =>
  typeof name === "string" ? name.trim().replace(/^models\//, "") : "";

// The API key is never included in any response.
function toResponse(config) {
  const source = config || DEFAULTS;

  return {
    provider: "gemini",
    model: source.model,
    defaultModel: getEnvModel(),
    temperature: source.temperature,
    maxOutputTokens: source.maxOutputTokens,
    responseFormat: source.responseFormat,
    timeoutSeconds: source.timeoutSeconds,
    retryAttempts: source.retryAttempts,
    apiKeyConfigured: Boolean(getEnvApiKey()),
    updatedAt: config?.updatedAt || null,
  };
}

function inRange(value, min, max) {
  return Number.isFinite(value) && value >= min && value <= max;
}

// Calls Gemini with a timeout. The key is sent in a header, not in the URL.
async function callGemini(path, apiKey, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(`${GEMINI_BASE_URL}${path}`, {
      headers: { "x-goog-api-key": apiKey },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function geminiErrorMessage(error) {
  return error.name === "AbortError"
    ? "The request to Gemini timed out. Try again."
    : "Could not reach Gemini. Check your internet connection.";
}

const MISSING_KEY_MESSAGE =
  "GEMINI_API_KEY is missing in the server .env file. Add it and restart the server.";

async function getConfig(req, res) {
  try {
    const config = await AIConfig.findOne();
    return res.json({ success: true, config: toResponse(config) });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load the AI configuration.",
    });
  }
}

async function saveConfig(req, res) {
  try {
    const {
      model,
      temperature,
      maxOutputTokens,
      responseFormat,
      timeoutSeconds,
      retryAttempts,
    } = req.body;

    const cleanModel = cleanModelName(model);
    const temp = Number(temperature);
    const tokens = Number(maxOutputTokens);
    const timeout = Number(timeoutSeconds);
    const retries = Number(retryAttempts);

    // A model is needed: either typed here or set as GEMINI_MODEL in .env.
    if (!cleanModel && !getEnvModel()) {
      return res.status(400).json({
        success: false,
        message:
          "Model name is required. Enter a model or set GEMINI_MODEL in the .env file.",
      });
    }
    if (!inRange(temp, 0, 2)) {
      return res.status(400).json({
        success: false,
        message: "Temperature must be between 0 and 2.",
      });
    }
    if (!Number.isInteger(tokens) || !inRange(tokens, 1, 100000)) {
      return res.status(400).json({
        success: false,
        message: "Maximum output tokens must be a whole number from 1 to 100,000.",
      });
    }
    if (!FORMATS.includes(responseFormat)) {
      return res
        .status(400)
        .json({ success: false, message: "Select a valid response format." });
    }
    if (!Number.isInteger(timeout) || !inRange(timeout, 10, 600)) {
      return res.status(400).json({
        success: false,
        message: "Timeout must be between 10 and 600 seconds.",
      });
    }
    if (!Number.isInteger(retries) || !inRange(retries, 0, 10)) {
      return res.status(400).json({
        success: false,
        message: "Retry attempts must be between 0 and 10.",
      });
    }

    let config = await AIConfig.findOne();
    if (!config) config = new AIConfig();

    config.model = cleanModel;
    config.temperature = temp;
    config.maxOutputTokens = tokens;
    config.responseFormat = responseFormat;
    config.timeoutSeconds = timeout;
    config.retryAttempts = retries;
    config.updatedBy = req.user?._id;

    await config.save();

    return res.json({
      success: true,
      message: "AI configuration saved successfully.",
      config: toResponse(config),
    });
  } catch (error) {
    console.error("saveConfig error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to save the AI configuration.",
    });
  }
}

// Tests the .env API key and checks that the model exists.
async function testConnection(req, res) {
  try {
    const apiKey = getEnvApiKey();

    if (!apiKey) {
      return res
        .status(400)
        .json({ success: false, message: MISSING_KEY_MESSAGE });
    }

    const saved = await AIConfig.findOne();
    const model =
      cleanModelName(req.body.model) || saved?.model || getEnvModel();

    // models.get checks both the key and the model name. It costs nothing.
    const path = model
      ? `/models/${encodeURIComponent(model)}`
      : "/models?pageSize=1";

    const response = await callGemini(path, apiKey);

    if (response.ok) {
      return res.json({
        success: true,
        message: model
          ? `Connection successful. The API key and the model "${model}" are valid.`
          : "Connection successful. The API key is valid.",
      });
    }

    if (response.status === 404 && model) {
      return res.status(400).json({
        success: false,
        message: `The model "${model}" was not found. Use "Load available models" to see the valid names.`,
      });
    }

    if ([400, 401, 403].includes(response.status)) {
      return res.status(400).json({
        success: false,
        message: "Gemini rejected the API key in the .env file. Check that it is correct.",
      });
    }

    return res.status(400).json({
      success: false,
      message: `Gemini returned an error (status ${response.status}).`,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: geminiErrorMessage(error) });
  }
}

// Returns the Gemini models that can generate text, for the Model suggestions.
async function listModels(req, res) {
  try {
    const apiKey = getEnvApiKey();

    if (!apiKey) {
      return res
        .status(400)
        .json({ success: false, message: MISSING_KEY_MESSAGE });
    }

    const response = await callGemini("/models?pageSize=200", apiKey);

    if (!response.ok) {
      return res.status(400).json({
        success: false,
        message: [400, 401, 403].includes(response.status)
          ? "Gemini rejected the API key in the .env file. Check that it is correct."
          : `Gemini returned an error (status ${response.status}).`,
      });
    }

    const data = await response.json();

    const models = (data.models || [])
      .filter((item) =>
        item.supportedGenerationMethods?.includes("generateContent"),
      )
      .map((item) => item.name.replace(/^models\//, ""))
      .sort();

    return res.json({ success: true, models });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: geminiErrorMessage(error) });
  }
}

module.exports = { getConfig, saveConfig, testConnection, listModels };