// Numbers and text for the Behavioral insights page.
// Behavior is INFERRED from attendance, marks and assignment data, so every
// number here is an indicator for human review, not a judgment.
const {
  FIELD_ALIASES,
  getNumber,
  getText,
  getTextFromResult,
  getIndicators,
  getAssignmentRate,
  buildPeriodSeries,
  average,
} = require("./studentData");

const ATTENDANCE_THRESHOLD = 75; // below this = irregular attendance
const ASSIGNMENT_THRESHOLD = 60; // below this = lower engagement
const MARKS_THRESHOLD = 50; // below this = low marks
const STRONG_ATTENDANCE = 90;
const CHANGE_MARGIN = 5; // marks change smaller than this = "stable"

const BANDS = [
  { label: "0–50", max: 50 },
  { label: "51–75", max: 75 },
  { label: "76–90", max: 90 },
  { label: "91–100", max: Infinity },
];

const bandIndex = (value) => {
  const index = BANDS.findIndex((band) => value <= band.max);
  return index === -1 ? BANDS.length - 1 : index;
};

const buildBehaviorMetrics = (records) => {
  const rows = records.map((record) => ({
    attendance: getNumber(record, FIELD_ALIASES.attendance),
    marks: getNumber(record, FIELD_ALIASES.marks),
    previousMarks: getNumber(record, FIELD_ALIASES.previousMarks),
    assignment: getAssignmentRate(record),
  }));

  const assignmentAvailable = rows.some((row) => row.assignment !== null);
  const compared = rows.filter((row) => row.marks !== null && row.previousMarks !== null);
  const hasPreviousMarks = compared.length > 0;

  const lowAttendance = (row) => row.attendance !== null && row.attendance < ATTENDANCE_THRESHOLD;
  const lowAssignment = (row) => row.assignment !== null && row.assignment < ASSIGNMENT_THRESHOLD;
  const lowMarks = (row) => row.marks !== null && row.marks < MARKS_THRESHOLD;

  const isOnTrack = (row) => {
    const checks = [];

    if (row.attendance !== null) checks.push(row.attendance >= ATTENDANCE_THRESHOLD);
    if (row.marks !== null) checks.push(row.marks >= MARKS_THRESHOLD);
    if (row.assignment !== null) checks.push(row.assignment >= ASSIGNMENT_THRESHOLD);

    return checks.length > 0 && checks.every(Boolean);
  };

  const irregular = rows.filter(lowAttendance).length;
  const lowEngagement = assignmentAvailable ? rows.filter(lowAssignment).length : null;

  const stable = compared.filter(
    (row) => Math.abs(row.marks - row.previousMarks) <= CHANGE_MARGIN,
  ).length;
  const improving = compared.filter(
    (row) => row.marks - row.previousMarks > CHANGE_MARGIN,
  ).length;

  // The two right-hand cards depend on what the data contains.
  const cards = [
    {
      key: "irregularAttendance",
      label: "Irregular attendance",
      value: irregular,
      description: `Attendance below ${ATTENDANCE_THRESHOLD}%`,
    },
    {
      key: "lowEngagement",
      label: "Lower engagement",
      value: lowEngagement,
      description: assignmentAvailable
        ? `Assignment completion below ${ASSIGNMENT_THRESHOLD}%`
        : "Assignment data not available",
    },
    hasPreviousMarks
      ? {
          key: "stable",
          label: "Stable performance",
          value: stable,
          description: `Marks within ${CHANGE_MARGIN} points of the previous result`,
        }
      : {
          key: "onTrack",
          label: "On-track students",
          value: rows.filter(isOnTrack).length,
          description: "No attendance, marks or assignment indicators",
        },
    hasPreviousMarks
      ? {
          key: "improving",
          label: "Improvement trend",
          value: improving,
          description: `Marks up by more than ${CHANGE_MARGIN} points`,
        }
      : {
          key: "strongAttendance",
          label: "Strong attendance",
          value: rows.filter((row) => row.attendance !== null && row.attendance >= STRONG_ATTENDANCE).length,
          description: `Attendance of ${STRONG_ATTENDANCE}% or more`,
        },
  ];

  // Average marks for students in each attendance range.
  const totals = BANDS.map(() => ({ sum: 0, count: 0 }));

  rows.forEach((row) => {
    if (row.attendance === null || row.marks === null) return;

    const index = bandIndex(row.attendance);
    totals[index].sum += row.marks;
    totals[index].count += 1;
  });

  const marksByAttendance = BANDS.map((band, index) => {
    const { sum, count } = totals[index];

    return {
      label: band.label,
      value: count ? Number((sum / count).toFixed(1)) : 0,
      empty: count === 0,
      note: `${count} ${count === 1 ? "student" : "students"}`,
    };
  });

  // How many students show each engagement indicator.
  const indicatorGroups = [
    {
      label: "Attendance",
      value: irregular,
      note: `Attendance below ${ATTENDANCE_THRESHOLD}%`,
    },
    {
      label: "Assignments",
      value: lowEngagement ?? 0,
      empty: !assignmentAvailable,
      note: assignmentAvailable
        ? `Assignment completion below ${ASSIGNMENT_THRESHOLD}%`
        : "Assignment data not available",
    },
    {
      label: "Marks",
      value: rows.filter(lowMarks).length,
      note: `Marks below ${MARKS_THRESHOLD}`,
    },
    {
      label: "Multiple",
      value: rows.filter(
        (row) => [lowAttendance(row), lowAssignment(row), lowMarks(row)].filter(Boolean).length >= 2,
      ).length,
      note: "Two or more indicators",
    },
  ];

  // Students below / at-or-above the attendance threshold, and their marks.
  const lowGroup = rows.filter((row) => lowAttendance(row) && row.marks !== null);
  const okGroup = rows.filter(
    (row) => row.attendance !== null && row.attendance >= ATTENDANCE_THRESHOLD && row.marks !== null,
  );

  // Average attendance and marks for each period, when the data has dates.
  const period = buildPeriodSeries(records);

  return {
    totalRecords: records.length,
    thresholds: {
      attendance: ATTENDANCE_THRESHOLD,
      assignment: ASSIGNMENT_THRESHOLD,
      marks: MARKS_THRESHOLD,
    },
    cards,
    trend: period.available
      ? { available: true, field: period.field, data: period.data }
      : { available: false },
    marksByAttendance,
    indicatorGroups,
    relationship: {
      lowCount: lowGroup.length,
      otherCount: okGroup.length,
      lowAverageMarks: average(lowGroup.map((row) => row.marks)),
      otherAverageMarks: average(okGroup.map((row) => row.marks)),
    },
  };
};

// Text for the AI insight card.
const buildBehaviorInsights = (result, metrics) => {
  const ai = (aliases) => {
    const text = getTextFromResult(result, aliases);
    return text ? { text, source: "ai" } : null;
  };

  const engagement = ai([
    "engagementPatterns",
    "behaviorInsights",
    "behaviourInsights",
    "behaviorSummary",
    "behaviourSummary",
    "engagementInsights",
  ]) || {
    text: "No explicit behavior or engagement summary was returned by the AI analysis. Attendance and academic indicators are shown separately; they are not proof of a student's behavior.",
    source: "data",
  };

  const r = metrics.relationship;
  const t = metrics.thresholds.attendance;

  return {
    engagement,
    attendance: ai(["attendanceInsights", "attendanceInsight", "attendanceAnalysis"]),
    academic: ai(["academicInsights", "academicInsight", "academicAnalysis"]),
    relationship:
      r.lowAverageMarks !== null && r.otherAverageMarks !== null
        ? `Students below ${t}% attendance (${r.lowCount}) average ${r.lowAverageMarks} in exams, compared with ${r.otherAverageMarks} for students at or above ${t}% (${r.otherCount}).`
        : null,
  };
};

// One row per student for the "Export data" button.
const getBehaviorRows = (records) =>
  records
    .map((record, index) => {
      const attendance = getNumber(record, FIELD_ALIASES.attendance);
      const marks = getNumber(record, FIELD_ALIASES.marks);
      const assignmentRate = getAssignmentRate(record);

      // Fees are not a behavior indicator.
      const indicators = getIndicators(record).filter((item) => item !== "Outstanding fees");

      let pattern = "Not enough data";

      if (indicators.length >= 2) pattern = "Multiple indicators";
      else if (attendance !== null && attendance < ATTENDANCE_THRESHOLD) pattern = "Irregular attendance";
      else if (assignmentRate !== null && assignmentRate < ASSIGNMENT_THRESHOLD) pattern = "Lower engagement";
      else if (marks !== null && marks < MARKS_THRESHOLD) pattern = "Low marks";
      else if (attendance !== null || marks !== null || assignmentRate !== null) pattern = "On track";

      return {
        id: getText(record, FIELD_ALIASES.studentId, `Record ${index + 1}`),
        name: getText(record, FIELD_ALIASES.studentName, `Student ${index + 1}`),
        department: getText(record, FIELD_ALIASES.department, ""),
        attendance,
        marks,
        assignmentRate,
        indicators,
        pattern,
      };
    })
    .sort(
      (a, b) =>
        b.indicators.length - a.indicators.length ||
        (a.attendance ?? 101) - (b.attendance ?? 101),
    );

module.exports = {
  buildBehaviorMetrics,
  buildBehaviorInsights,
  getBehaviorRows,
};