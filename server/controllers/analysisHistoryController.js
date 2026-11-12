const {
  listCompletedAnalyses,
  loadAnalysisById,
  sendError,
} = require("../utils/reportLoader");
const { buildHistoryItems, filterSortPaginate } = require("../utils/historyData");
const { buildStudents } = require("../utils/studentData");
const { buildFullReport } = require("../utils/reportData");

// ---------------------------------------------------------------
// Change these two lines if your model files have different names
// (the same names you set in utils/reportLoader.js).
// ---------------------------------------------------------------
const Dataset = require("../models/Dataset");
const Analysis = require("../models/Analysis");

// GET /api/analysis-history?search=&sort=newest|oldest&page=&limit=
// The list of completed analyses for the institution.
const getHistory = async (req, res) => {
  try {
    const base = await listCompletedAnalyses(req);
    const all = buildHistoryItems(base);

    const { items, pagination } = filterSortPaginate(all, req.query);

    // "Review indicators" needs the records and the AI result,
    // so it is calculated only for the rows on this page.
    if (items.length > 0) {
      const [analyses, datasets] = await Promise.all([
        Analysis.find({ _id: { $in: items.map((i) => i.analysisId) } })
          .select("result")
          .lean(),
        Dataset.find({ _id: { $in: items.map((i) => i.datasetId) } })
          .select("records")
          .lean(),
      ]);

      const resultById = new Map(analyses.map((a) => [String(a._id), a.result || {}]));
      const recordsById = new Map(
        datasets.map((d) => [String(d._id), Array.isArray(d.records) ? d.records : []]),
      );

      items.forEach((item) => {
        item.reviewCount = buildStudents(
          resultById.get(item.analysisId) || {},
          recordsById.get(item.datasetId) || [],
        ).length;
      });
    }

    return res.status(200).json({
      success: true,
      totalAnalyses: all.length,
      items: items.map(({ sortTime, ...item }) => item),
      pagination,
    });
  } catch (error) {
    return sendError(res, error, "Analysis History");
  }
};

// GET /api/analysis-history/report/:analysisId
// One saved report (same shape as the "latest analysis" API).
const getReport = async (req, res) => {
  try {
    const { dataset, analysis } = await loadAnalysisById(req, req.params.analysisId);

    return res.status(200).json({ success: true, dataset, analysis });
  } catch (error) {
    return sendError(res, error, "Analysis Report");
  }
};


// GET /api/analysis-history/:analysisId/details
// Everything for the one-page report: summary, attendance, behavior,
// academic results and the AI text, calculated from that saved analysis.
const getReportDetails = async (req, res) => {
  try {
    const { dataset, analysis } = await loadAnalysisById(req, req.params.analysisId);

    const records = Array.isArray(dataset.records) ? dataset.records : [];
    const result = analysis.result || {};

    // The friendly ID (AI-0048) and the creator come from the history list.
    const all = buildHistoryItems(await listCompletedAnalyses(req));
    const item = all.find((entry) => entry.analysisId === String(analysis._id));

    return res.status(200).json({
      success: true,
      report: {
        analysisId: String(analysis._id),
        displayId: item?.displayId || "",
        datasetName: dataset.name || dataset.originalFileName || "Dataset",
        fileName: dataset.originalFileName || "",
        date: analysis.completedAt || analysis.updatedAt || analysis.createdAt || null,
        students: records.length,
        createdBy: item?.createdBy || "Unknown",
        status: "completed",
      },
      ...buildFullReport(result, records),
    });
  } catch (error) {
    return sendError(res, error, "Report Details");
  }
};

const priorityOrder = { High: 0, Medium: 1, Review: 2, Low: 3 };

// GET /api/analysis-history/:analysisId/students
// Query: page, limit, search, priority (all | High | Medium | Other), all=true
// The student list of that report, one page at a time.
const getReportStudents = async (req, res) => {
  try {
    const { dataset, analysis } = await loadAnalysisById(req, req.params.analysisId);

    const records = Array.isArray(dataset.records) ? dataset.records : [];
    const everyone = buildStudents(analysis.result || {}, records);

    const isOther = (student) => student.priority !== "High" && student.priority !== "Medium";

    const counts = {
      all: everyone.length,
      high: everyone.filter((s) => s.priority === "High").length,
      medium: everyone.filter((s) => s.priority === "Medium").length,
      other: everyone.filter(isOther).length,
    };

    const search = String(req.query.search || "").trim().toLowerCase();
    const priority = String(req.query.priority || "all");

    let list = everyone;

    if (priority === "High" || priority === "Medium") {
      list = list.filter((student) => student.priority === priority);
    } else if (priority === "Other") {
      list = list.filter(isOther);
    }

    if (search) {
      list = list.filter(
        (student) =>
          student.name.toLowerCase().includes(search) ||
          student.id.toLowerCase().includes(search) ||
          String(student.department || "").toLowerCase().includes(search),
      );
    }

    // High first, then more indicators, then lower attendance.
    list = [...list].sort(
      (a, b) =>
        (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9) ||
        b.indicators.length - a.indicators.length ||
        (a.attendance ?? 101) - (b.attendance ?? 101),
    );

    // Used by the "Download CSV" button.
    if (req.query.all === "true") {
      return res.status(200).json({
        success: true,
        datasetName: dataset.name || dataset.originalFileName || "dataset",
        students: list,
        counts,
      });
    }

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const total = list.length;
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const page = Math.min(Math.max(parseInt(req.query.page, 10) || 1, 1), totalPages);

    return res.status(200).json({
      success: true,
      students: list.slice((page - 1) * limit, page * limit),
      counts,
      pagination: { page, limit, total, totalPages },
    });
  } catch (error) {
    return sendError(res, error, "Report Students");
  }
};

module.exports = { getHistory, getReport, getReportDetails, getReportStudents };