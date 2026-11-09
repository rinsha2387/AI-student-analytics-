const { loadReport, sendError } = require("../utils/reportLoader");
const {
  buildAttendanceMetrics,
  buildAttendanceInsights,
  getAttendanceRows,
} = require("../utils/studentData");

// GET /api/attendance-analytics/summary
// Numbers for the cards and charts, plus the AI attendance summary.
const getSummary = async (req, res) => {
  try {
    const { dataset, analysis } = await loadReport(req);

    const records = Array.isArray(dataset.records) ? dataset.records : [];
    const result = analysis.result || {};

    const metrics = buildAttendanceMetrics(records);
    const insights = buildAttendanceInsights(result, metrics);

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
    return sendError(res, error, "Attendance Summary");
  }
};

// GET /api/attendance-analytics/export
// One row per student, lowest attendance first (for the Export button).
const getExport = async (req, res) => {
  try {
    const { dataset } = await loadReport(req);

    const records = Array.isArray(dataset.records) ? dataset.records : [];

    return res.status(200).json({
      success: true,
      datasetName: dataset.name || dataset.originalFileName || "dataset",
      rows: getAttendanceRows(records),
    });
  } catch (error) {
    return sendError(res, error, "Attendance Export");
  }
};

module.exports = { getSummary, getExport };