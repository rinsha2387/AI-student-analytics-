const mongoose = require("mongoose");
const User = require("../models/User");

// ---------------------------------------------------------------
// MODEL NAMES: change these two lines if your model files have
// different names. They are used by every insights page, so you
// only need to fix them here.
// ---------------------------------------------------------------
const Dataset = require("../models/Dataset");
const Analysis = require("../models/Analysis");

// The field that stores who uploaded the data. The code checks which of
// these names exists in your schema. Add your own name here if needed.
const OWNER_FIELDS = [
  "user",
  "createdBy",
  "uploadedBy",
  "owner",
  "manager",
  "userId",
];

const httpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const sendError = (res, error, label) => {
  if (error.status) {
    return res.status(error.status).json({ success: false, message: error.message });
  }

  console.error(`${label} Error:`, error);
  return res.status(500).json({ success: false, message: "Server error" });
};

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const findOwnerField = (Model) =>
  OWNER_FIELDS.find((field) => Model.schema.path(field));

// Managers of the same institution (name + city) share the same data.
const getInstitutionUserIds = async (user) => {
  const users = await User.find({
    "institution.name": new RegExp(`^${escapeRegex(user.institution?.name?.trim() || "")}$`, "i"),
    "institution.city": new RegExp(`^${escapeRegex(user.institution?.city?.trim() || "")}$`, "i"),
    role: { $in: ["manager", "admin"] },
  }).select("_id");

  const ids = users.map((u) => u._id);

  if (!ids.some((id) => String(id) === String(user._id))) ids.push(user._id);

  return ids;
};

// Finds the newest completed AI analysis (or the one for ?datasetId=)
// and the dataset it belongs to.
const loadReport = async (req) => {
  const { datasetId } = req.query;

  if (datasetId && !mongoose.Types.ObjectId.isValid(datasetId)) {
    throw httpError(400, "Invalid dataset id");
  }

  const ownerIds = await getInstitutionUserIds(req.user);
  const conditions = [{ status: "completed" }];

  if (datasetId) conditions.push({ dataset: datasetId });

  const analysisOwnerField = findOwnerField(Analysis);

  if (analysisOwnerField) {
    conditions.push({ [analysisOwnerField]: { $in: ownerIds } });
  } else {
    const datasetOwnerField = findOwnerField(Dataset);

    if (!datasetOwnerField) {
      throw httpError(
        500,
        "Could not find the owner field in your Dataset or Analysis model. Add its name to OWNER_FIELDS in utils/reportLoader.js.",
      );
    }

    const owned = await Dataset.find({ [datasetOwnerField]: { $in: ownerIds } })
      .select("_id")
      .lean();

    conditions.push({ dataset: { $in: owned.map((d) => d._id) } });
  }

  const analysis = await Analysis.findOne({ $and: conditions })
    .sort({ createdAt: -1, _id: -1 })
    .lean();

  if (!analysis) {
    throw httpError(
      404,
      "No completed analysis is available yet. Upload a dataset and run AI analysis first.",
    );
  }

  const dataset = await Dataset.findById(
    analysis.dataset?._id || analysis.dataset,
  ).lean();

  if (!dataset) throw httpError(404, "The dataset for this analysis was not found.");

  return { dataset, analysis };
};

module.exports = { loadReport, sendError, httpError };