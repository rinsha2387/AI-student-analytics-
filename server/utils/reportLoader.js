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


// All completed analyses of the institution, WITHOUT the heavy data
// (records and AI result are not loaded here).
const listCompletedAnalyses = async (req) => {
  const ownerIds = await getInstitutionUserIds(req.user);

  const analysisOwnerField = findOwnerField(Analysis);
  const datasetOwnerField = findOwnerField(Dataset);

  const filter = { status: "completed" };

  if (analysisOwnerField) {
    filter[analysisOwnerField] = { $in: ownerIds };
  } else {
    if (!datasetOwnerField) {
      throw httpError(
        500,
        "Could not find the owner field in your Dataset or Analysis model. Add its name to OWNER_FIELDS in utils/reportLoader.js.",
      );
    }

    const owned = await Dataset.find({ [datasetOwnerField]: { $in: ownerIds } })
      .select("_id")
      .lean();

    filter.dataset = { $in: owned.map((d) => d._id) };
  }

  const fields = ["dataset", "createdAt", "updatedAt", "completedAt", analysisOwnerField]
    .filter(Boolean)
    .join(" ");

  const analyses = await Analysis.find(filter).select(fields).lean();

  const asId = (value) => String(value?._id || value || "");
  const datasetIds = [...new Set(analyses.map((a) => asId(a.dataset)))].filter((id) =>
    mongoose.Types.ObjectId.isValid(id),
  );

  // The aggregation counts the records without loading them.
  const datasets = datasetIds.length
    ? await Dataset.aggregate([
        { $match: { _id: { $in: datasetIds.map((id) => new mongoose.Types.ObjectId(id)) } } },
        {
          $project: {
            name: 1,
            originalFileName: 1,
            ...(datasetOwnerField ? { [datasetOwnerField]: 1 } : {}),
            studentCount: {
              $cond: [{ $isArray: "$records" }, { $size: "$records" }, 0],
            },
          },
        },
      ])
    : [];

  // Names of the people who created the analyses.
  const creatorIds = new Set();

  analyses.forEach((a) => {
    if (analysisOwnerField && a[analysisOwnerField]) creatorIds.add(asId(a[analysisOwnerField]));
  });

  if (!analysisOwnerField && datasetOwnerField) {
    datasets.forEach((d) => d[datasetOwnerField] && creatorIds.add(asId(d[datasetOwnerField])));
  }

  const creators = creatorIds.size
    ? await User.find({ _id: { $in: [...creatorIds] } }).select("name").lean()
    : [];

  return { analyses, datasets, creators, analysisOwnerField, datasetOwnerField };
};

// One saved analysis (any date) with its dataset.
// Same shape as the "latest analysis" API used by the AI Analysis page.
const loadAnalysisById = async (req, analysisId) => {
  if (!mongoose.Types.ObjectId.isValid(analysisId)) {
    throw httpError(400, "Invalid report id");
  }

  const ownerIds = await getInstitutionUserIds(req.user);

  const analysis = await Analysis.findById(analysisId).lean();

  if (!analysis || analysis.status !== "completed") {
    throw httpError(404, "Report not found");
  }

  const dataset = await Dataset.findById(analysis.dataset?._id || analysis.dataset).lean();

  if (!dataset) throw httpError(404, "The dataset for this report was not found.");

  // The report must belong to someone in the manager's institution.
  const analysisOwnerField = findOwnerField(Analysis);
  const datasetOwnerField = findOwnerField(Dataset);

  if (!analysisOwnerField && !datasetOwnerField) {
    throw httpError(
      500,
      "Could not find the owner field in your Dataset or Analysis model. Add its name to OWNER_FIELDS in utils/reportLoader.js.",
    );
  }

  const owner = analysisOwnerField ? analysis[analysisOwnerField] : dataset[datasetOwnerField];
  const ownerId = String(owner?._id || owner || "");

  if (!ownerIds.some((id) => String(id) === ownerId)) {
    throw httpError(404, "Report not found");
  }

  return { dataset, analysis };
};

module.exports = {
  loadReport,
  listCompletedAnalyses,
  loadAnalysisById,
  sendError,
  httpError,
};