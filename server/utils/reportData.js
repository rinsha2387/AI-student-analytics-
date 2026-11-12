// Everything the full report page needs, calculated from one saved analysis.
const {
  getTextFromResult,
  getNumber,
  FIELD_ALIASES,
  average,
  buildStudents,
  buildMetrics,
  buildAttendanceMetrics,
  buildAttendanceInsights,
} = require("./studentData");
const { buildBehaviorMetrics, buildBehaviorInsights } = require("./behaviorData");

const MARKS_THRESHOLD = 50;

// Turns a paragraph (or a bullet list) into a list of short points.
const toPoints = (text) => {
  if (!text || typeof text !== "string") return [];

  const lines = text
    .split(/\n+/)
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);

  if (lines.length === 1) {
    return lines[0]
      .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
      .map((point) => point.trim())
      .filter(Boolean);
  }

  return lines;
};

const buildAcademicMetrics = (records) => {
  const marks = records
    .map((record) => getNumber(record, FIELD_ALIASES.marks))
    .filter((value) => value !== null);

  return {
    recordsWithMarks: marks.length,
    averageMarks: average(marks),
    highest: marks.length ? Math.max(...marks) : null,
    lowest: marks.length ? Math.min(...marks) : null,
    threshold: MARKS_THRESHOLD,
    belowThreshold: marks.filter((value) => value < MARKS_THRESHOLD).length,
    marksDistribution: buildMetrics(records, []).marksDistribution,
  };
};

const buildAcademicInsight = (result, metrics) => {
  const ai = getTextFromResult(result, [
    "academicInsights",
    "academicInsight",
    "academicAnalysis",
  ]);

  if (ai) return { text: ai, source: "ai" };

  return {
    text:
      metrics.averageMarks !== null
        ? `The average examination mark is ${metrics.averageMarks}%. ${metrics.belowThreshold} students have marks below ${metrics.threshold}.`
        : "Examination marks are not available in a recognized numeric column.",
    source: "data",
  };
};

const buildExecutiveSummary = (result) => {
  const ai = getTextFromResult(result, [
    "executiveSummary",
    "summary",
    "overallSummary",
    "managementSummary",
  ]);

  const text =
    ai ||
    "The analysis completed, but no executive summary was returned by the configured AI prompt.";

  return { text, points: toPoints(text), source: ai ? "ai" : "data" };
};

const buildFullReport = (result, records) => {
  const students = buildStudents(result, records);

  const attendanceMetrics = buildAttendanceMetrics(records);
  const behaviorMetrics = buildBehaviorMetrics(records);
  const academicMetrics = buildAcademicMetrics(records);

  const attendanceInsights = buildAttendanceInsights(result, attendanceMetrics);
  const behaviorInsights = buildBehaviorInsights(result, behaviorMetrics);

  return {
    summary: buildExecutiveSummary(result),
    overview: {
      totalStudents: records.length,
      reviewCount: students.length,
      highCount: students.filter((s) => s.priority === "High").length,
      mediumCount: students.filter((s) => s.priority === "Medium").length,
      attendanceConcerns: attendanceMetrics.belowThreshold,
      attendanceThreshold: attendanceMetrics.threshold,
      academicConcerns: academicMetrics.belowThreshold,
      academicThreshold: academicMetrics.threshold,
    },
    attendance: { metrics: attendanceMetrics, insights: attendanceInsights },
    behavior: { metrics: behaviorMetrics, insights: behaviorInsights },
    academic: {
      metrics: academicMetrics,
      insight: buildAcademicInsight(result, academicMetrics),
    },
  };
};

module.exports = { buildFullReport, toPoints };