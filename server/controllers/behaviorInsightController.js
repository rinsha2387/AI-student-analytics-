const { loadReport, sendError } = require("../utils/reportLoader");
const {
  buildBehaviorMetrics,
  buildBehaviorInsights,
  getBehaviorRows,
} = require("../utils/behaviorData");

// GET /api/behavior-insights/summary
// Numbers for the cards and charts, plus the AI engagement summary.
const getSummary = async (req, res) => {
  try {
    const { dataset, analysis } = await loadReport(req);

    const records = Array.isArray(dataset.records) ? dataset.records : [];
    const result = analysis.result || {};

    const metrics = buildBehaviorMetrics(records);
    const insights = buildBehaviorInsights(result, metrics);

    return res.status(200).json({
      success: true,
      dataset: {
        _id: dataset._id,
        name: dataset.name || dataset.originalFileName || "Dataset",
      },
      analysis: {
        _id: analysis._id,
        completedAt: analysis.completedAt || analysis.updatedAt || null,
      },
      metrics,
      insights,
    });
  } catch (error) {
    return sendError(res, error, "Behavior Summary");
  }
};

// GET /api/behavior-insights/export
// One row per student with the engagement indicators.
const getExport = async (req, res) => {
  try {
    const { dataset } = await loadReport(req);

    const records = Array.isArray(dataset.records) ? dataset.records : [];

    return res.status(200).json({
      success: true,
      datasetName: dataset.name || dataset.originalFileName || "dataset",
      rows: getBehaviorRows(records),
    });
  } catch (error) {
    return sendError(res, error, "Behavior Export");
  }
};

module.exports = { getSummary, getExport };