const { loadReport, sendError } = require("../utils/reportLoader");
const {
  buildStudents,
  buildMetrics,
  buildInsights,
} = require("../utils/studentData");

const priorityOrder = { High: 0, Medium: 1 };

// GET /api/student-insights/summary
// Numbers for the cards and charts, plus the AI summary text.
const getSummary = async (req, res) => {
  try {
    const { dataset, analysis } = await loadReport(req);

    const records = Array.isArray(dataset.records) ? dataset.records : [];
    const result = analysis.result || {};

    const students = buildStudents(result, records);
    const metrics = buildMetrics(records, students);
    const insights = buildInsights(result, metrics);

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
    return sendError(res, error, "Student Insights Summary");
  }
};

// GET /api/student-insights/students
// Query: page, limit, search, priority (all | High | Medium), all=true
// Only High and Medium priority students are returned.
const getStudents = async (req, res) => {
  try {
    const { dataset, analysis } = await loadReport(req);

    const records = Array.isArray(dataset.records) ? dataset.records : [];
    const result = analysis.result || {};

    const flagged = buildStudents(result, records).filter(
      (student) => student.priority === "High" || student.priority === "Medium",
    );

    const counts = {
      high: flagged.filter((s) => s.priority === "High").length,
      medium: flagged.filter((s) => s.priority === "Medium").length,
    };

    const search = String(req.query.search || "").trim().toLowerCase();
    const priority = String(req.query.priority || "all");

    let list = flagged;

    if (priority === "High" || priority === "Medium") {
      list = list.filter((student) => student.priority === priority);
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
    list = [...list].sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }

      if (b.indicators.length !== a.indicators.length) {
        return b.indicators.length - a.indicators.length;
      }

      return (a.attendance ?? 101) - (b.attendance ?? 101);
    });

    // Used by the "Export data" button.
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
    return sendError(res, error, "Student Insights Students");
  }
};

module.exports = { getSummary, getStudents, loadReport };