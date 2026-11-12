const { loadReport, sendError } = require("../utils/reportLoader");
const { buildStudents } = require("../utils/studentData");
const {
  buildFinancialMetrics,
  buildFinancialInsights,
  getFinancialRows,
} = require("../utils/financialData");

// Reads ?annualFee= and ?yearsLeft= (the manager's average values).
const readAssumptions = (query) => {
  const toNumber = (value) => {
    if (value === undefined || value === null || String(value).trim() === "") return null;

    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : null;
  };

  return {
    annualFee: toNumber(query.annualFee),
    yearsLeft: toNumber(query.yearsLeft),
  };
};

// GET /api/financial-impact/summary
const getSummary = async (req, res) => {
  try {
    const { dataset, analysis } = await loadReport(req);

    const records = Array.isArray(dataset.records) ? dataset.records : [];
    const result = analysis.result || {};
    const assumptions = readAssumptions(req.query);

    const students = buildStudents(result, records);
    const metrics = buildFinancialMetrics(students, records.length, assumptions);
    const insights = buildFinancialInsights(result, metrics, assumptions);

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
      assumptions,
      metrics,
      insights,
    });
  } catch (error) {
    return sendError(res, error, "Financial Summary");
  }
};

// GET /api/financial-impact/export
const getExport = async (req, res) => {
  try {
    const { dataset, analysis } = await loadReport(req);

    const records = Array.isArray(dataset.records) ? dataset.records : [];
    const students = buildStudents(analysis.result || {}, records);

    return res.status(200).json({
      success: true,
      datasetName: dataset.name || dataset.originalFileName || "dataset",
      rows: getFinancialRows(students, readAssumptions(req.query)),
    });
  } catch (error) {
    return sendError(res, error, "Financial Export");
  }
};

module.exports = { getSummary, getExport };