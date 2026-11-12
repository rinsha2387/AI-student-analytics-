// Helpers that read the uploaded student records and the saved AI result.
// The rules here are the same ones the AI Analysis page uses, so both pages
// show the same numbers.

const normalizeKey = (key) =>
  String(key ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const FIELD_ALIASES = {
  studentId: [
    "studentid",
    "studentnumber",
    "registrationnumber",
    "registrationno",
    "rollnumber",
    "rollno",
    "admissionnumber",
    "admissionno",
    "id",
  ],
  studentName: ["studentname", "fullname", "nameofstudent", "name"],
  department: [
    "department",
    "course",
    "branch",
    "program",
    "programme",
    "stream",
    "major",
    "class",
  ],
  attendance: [
    "attendance",
    "attendancepercentage",
    "attendancepercent",
    "attendancepct",
    "attendancerate",
    "presentpercentage",
  ],
  marks: [
    "marks",
    "exammarks",
    "exammark",
    "examinationmarks",
    "examinationmark",
    "marksobtained",
    "marksscored",
    "totalmarks",
    "totalmark",
    "totalassessment",
    "assessmentmarks",
    "score",
    "examscore",
    "testscore",
  ],
  annualFee: [
    "annualfee",
    "feeperyear",
    "feesperyear",
    "yearlyfee",
    "yearlyfees",
    "tuitionfee",
    "tuitionfees",
    "coursefee",
  ],
  remainingYears: [
    "remainingyears",
    "yearsleft",
    "yearsremaining",
    "remainingyearsofstudy",
  ],
  previousMarks: [
    "previousmarks",
    "previousexammarks",
    "previousscore",
    "previousexamscore",
    "priormarks",
    "lastmarks",
    "lastexammarks",
    "previousassessment",
  ],
  assignmentRate: [
    "assignmentcompletion",
    "assignmentcompletionrate",
    "assignmentcompletionpercentage",
    "assignmentcompletionpercent",
    "completionrate",
  ],
  previousAttendance: [
    "previousattendance",
    "priorattendance",
    "lastattendance",
    "prevattendance",
    "previoustermattendance",
    "lastmonthattendance",
    "attendanceprevious",
  ],
  assignmentsCompleted: [
    "assignmentscompleted",
    "completedassignments",
    "taskscompleted",
    "assignmentsdone",
  ],
  totalAssignments: [
    "totalassignments",
    "assignmentstotal",
    "assignmentsassigned",
    "totaltasks",
    "numberofassignments",
  ],
  feesDue: [
    "feesdue",
    "feedue",
    "outstandingfees",
    "pendingfees",
    "balancedue",
    "unpaidfees",
    "amountdue",
    "totalfeesdue",
    "remainingfees",
  ],
};

const getField = (record, aliases) => {
  if (!record || typeof record !== "object") return undefined;

  const normalizedAliases = aliases.map(normalizeKey);

  const matchingKey = Object.keys(record).find((key) =>
    normalizedAliases.includes(normalizeKey(key)),
  );

  return matchingKey === undefined ? undefined : record[matchingKey];
};

const getNumber = (record, aliases) => {
  const value = getField(record, aliases);

  if (value === undefined || value === null) return null;
  if (typeof value === "string" && !value.trim()) return null;

  // Supports values such as "1,250" and "75%".
  const cleaned =
    typeof value === "string"
      ? value.replace(/,/g, "").replace(/%$/, "").trim()
      : value;

  const number = Number(cleaned);

  return Number.isFinite(number) ? number : null;
};

const getText = (record, aliases, fallback = "Not available") => {
  const value = getField(record, aliases);

  if (value === undefined || value === null || String(value).trim() === "") {
    return fallback;
  }

  return String(value).trim();
};

const getArray = (result, aliases) => {
  if (!result || typeof result !== "object") return [];

  for (const alias of aliases) {
    const key = Object.keys(result).find(
      (item) => normalizeKey(item) === normalizeKey(alias),
    );

    if (key && Array.isArray(result[key])) return result[key];
  }

  return [];
};

const getTextFromResult = (result, aliases) => {
  if (!result || typeof result !== "object") return "";

  for (const alias of aliases) {
    const key = Object.keys(result).find(
      (item) => normalizeKey(item) === normalizeKey(alias),
    );

    if (key && typeof result[key] === "string" && result[key].trim()) {
      return result[key].trim();
    }

    // A list of sentences, for example ["Point one", "Point two"]
    if (key && Array.isArray(result[key])) {
      const lines = result[key]
        .filter((item) => typeof item === "string" && item.trim())
        .map((item) => item.trim());

      if (lines.length > 0) return lines.join("\n");
    }

    if (key && result[key] && typeof result[key] === "object" && !Array.isArray(result[key])) {
      const nested = result[key];

      for (const field of ["summary", "description", "insight", "text"]) {
        if (typeof nested[field] === "string" && nested[field].trim()) {
          return nested[field].trim();
        }
      }
    }
  }

  return "";
};

const getPriority = (student) => {
  const explicitPriority = getText(
    student,
    ["priority", "riskLevel", "riskCategory", "severity"],
    "",
  ).toLowerCase();

  if (["high", "critical", "very high"].includes(explicitPriority)) return "High";
  if (["medium", "moderate"].includes(explicitPriority)) return "Medium";
  if (["low", "minimal"].includes(explicitPriority)) return "Low";

  const attendance = getNumber(student, FIELD_ALIASES.attendance);
  const marks = getNumber(student, FIELD_ALIASES.marks);

  if ((attendance !== null && attendance < 50) || (marks !== null && marks < 35)) {
    return "High";
  }

  if ((attendance !== null && attendance < 75) || (marks !== null && marks < 50)) {
    return "Medium";
  }

  return "Review";
};

// Assignment completion as a percentage (0-100), or null when the data has none.
const getAssignmentRate = (record) => {
  const rate = getNumber(record, FIELD_ALIASES.assignmentRate);

  if (rate !== null) return rate <= 1 ? Number((rate * 100).toFixed(1)) : rate;

  const completed = getNumber(record, FIELD_ALIASES.assignmentsCompleted);
  const total = getNumber(record, FIELD_ALIASES.totalAssignments);

  if (completed !== null && total !== null && total > 0) {
    return Number(((completed / total) * 100).toFixed(1));
  }

  return null;
};

const getIndicators = (student) => {
  const indicators = [];

  const attendance = getNumber(student, FIELD_ALIASES.attendance);
  const marks = getNumber(student, FIELD_ALIASES.marks);

  if (attendance !== null && attendance < 75) indicators.push("Low attendance");
  if (marks !== null && marks < 50) indicators.push("Low marks");

  const assignmentRate = getAssignmentRate(student);

  if (assignmentRate !== null && assignmentRate < 60) {
    indicators.push("Low assignment completion");
  }

  const feesDue = getNumber(student, FIELD_ALIASES.feesDue);
  if (feesDue !== null && feesDue > 0) indicators.push("Outstanding fees");

  return indicators;
};

const academicStatusFor = (marks) => {
  if (marks === null) return "Not available";
  return marks < 50 ? "Needs review" : "Recorded";
};

// Builds the list of students that need review.
// 1) Uses the list returned by the AI analysis when there is one.
// 2) Otherwise uses the uploaded records that have at least one indicator.
const buildStudents = (result, records) => {
  const aiStudents = getArray(result, [
    "studentsRequiringReview",
    "studentsFlaggedForReview",
    "studentsNeedingReview",
    "highRiskStudents",
    "atRiskStudents",
    "studentsAtRisk",
    "riskStudents",
  ]);

  if (aiStudents.length > 0) {
    const recordsById = new Map();

    records.forEach((record) => {
      const recordId = getText(record, FIELD_ALIASES.studentId, "");
      if (recordId && !recordsById.has(recordId)) recordsById.set(recordId, record);
    });

    return aiStudents.map((student, index) => {
      const studentId = getText(student, FIELD_ALIASES.studentId, `Record ${index + 1}`);
      const merged = { ...(recordsById.get(studentId) || {}), ...student };
      const marks = getNumber(merged, FIELD_ALIASES.marks);

      return {
        id: studentId,
        name: getText(merged, FIELD_ALIASES.studentName, studentId),
        department: getText(merged, FIELD_ALIASES.department, ""),
        attendance: getNumber(merged, FIELD_ALIASES.attendance),
        marks,
        academicStatus:
          getText(merged, ["academicStatus", "performanceStatus"], "") ||
          academicStatusFor(marks),
        indicators: getIndicators(merged),
        priority: getPriority(merged),
        annualFee: getNumber(merged, FIELD_ALIASES.annualFee),
        remainingYears: getNumber(merged, FIELD_ALIASES.remainingYears),
      };
    });
  }

  return records
    .map((record, index) => {
      const marks = getNumber(record, FIELD_ALIASES.marks);

      return {
        id: getText(
          record,
          ["studentId", "studentID", "id", "rollNumber", "rollNo"],
          `Record ${index + 1}`,
        ),
        name: getText(
          record,
          ["studentName", "name", "fullName"],
          `Student ${index + 1}`,
        ),
        department: getText(record, FIELD_ALIASES.department, ""),
        attendance: getNumber(record, FIELD_ALIASES.attendance),
        marks,
        academicStatus: academicStatusFor(marks),
        indicators: getIndicators(record),
        priority: getPriority(record),
        annualFee: getNumber(record, FIELD_ALIASES.annualFee),
        remainingYears: getNumber(record, FIELD_ALIASES.remainingYears),
      };
    })
    .filter((student) => student.indicators.length > 0);
};

const average = (values) =>
  values.length
    ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1))
    : null;

const bucketize = (values, buckets) => {
  const counts = buckets.map((bucket) => ({ label: bucket.label, value: 0 }));

  values.forEach((value) => {
    const index = buckets.findIndex((bucket) => value <= bucket.max);
    counts[index === -1 ? counts.length - 1 : index].value += 1;
  });

  return counts;
};

const buildMetrics = (records, students) => {
  const marks = records
    .map((record) => getNumber(record, FIELD_ALIASES.marks))
    .filter((value) => value !== null);

  const attendance = records
    .map((record) => getNumber(record, FIELD_ALIASES.attendance))
    .filter((value) => value !== null);

  const academicConcerns = marks.filter((value) => value < 50).length;
  const attendanceConcerns = attendance.filter((value) => value < 75).length;

  return {
    totalStudents: records.length,
    averageMarks: average(marks),
    averageAttendance: average(attendance),
    highCount: students.filter((s) => s.priority === "High").length,
    mediumCount: students.filter((s) => s.priority === "Medium").length,
    academicConcerns,
    attendanceConcerns,
    marksDistribution: bucketize(marks, [
      { label: "0–40", max: 40 },
      { label: "41–60", max: 60 },
      { label: "61–80", max: 80 },
      { label: "81–100", max: Infinity },
    ]),
    attendanceDistribution: bucketize(attendance, [
      { label: "0–50", max: 50 },
      { label: "51–75", max: 75 },
      { label: "76–90", max: 90 },
      { label: "91–100", max: Infinity },
    ]),
  };
};

// Text for the AI insight card. Uses the saved AI text when it exists,
// otherwise a plain summary of the numbers (marked with source "data").
const buildInsights = (result, metrics) => {
  const pick = (aliases, fallback) => {
    const text = getTextFromResult(result, aliases);
    return text ? { text, source: "ai" } : { text: fallback, source: "data" };
  };

  return {
    overall: pick(
      ["executiveSummary", "summary", "overallSummary", "managementSummary"],
      `${metrics.totalStudents} student records were analyzed. ${metrics.highCount} students are high priority and ${metrics.mediumCount} are medium priority for review.`,
    ),
    academic: pick(
      ["academicInsights", "academicInsight", "academicAnalysis"],
      metrics.averageMarks !== null
        ? `The average examination mark is ${metrics.averageMarks}%. ${metrics.academicConcerns} students have marks below 50.`
        : "Examination marks are not available in a recognized numeric column.",
    ),
    attendance: pick(
      ["attendanceInsights", "attendanceInsight", "attendanceAnalysis"],
      metrics.averageAttendance !== null
        ? `Average attendance is ${metrics.averageAttendance}%. ${metrics.attendanceConcerns} students have attendance below 75%.`
        : "Attendance values are not available in a recognized numeric column.",
    ),
  };
};


/* ------------------------------------------------------------------
   Attendance analytics
------------------------------------------------------------------ */

const ATTENDANCE_THRESHOLD = 75;
const CRITICAL_THRESHOLD = 50;

// Columns that can tell us "when" the attendance was recorded.
const PERIOD_ALIASES = [
  "month",
  "monthname",
  "attendancemonth",
  "period",
  "date",
  "attendancedate",
  "week",
  "term",
  "semester",
];

const MONTHS = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
];

const findKeyName = (records, aliases) => {
  const normalized = aliases.map(normalizeKey);

  for (const record of records.slice(0, 50)) {
    if (!record || typeof record !== "object") continue;

    const key = Object.keys(record).find((k) => normalized.includes(normalizeKey(k)));
    if (key) return key;
  }

  return null;
};

const monthIndexOf = (label) =>
  MONTHS.findIndex((month) => label.toLowerCase().startsWith(month));

// Groups the records by a period column (month, week, term ...) and gives the
// average attendance and average marks of each period.
// Returns { available: false } when the data has no usable period column.
const buildPeriodSeries = (records) => {
  const keyName = findKeyName(records, PERIOD_ALIASES);
  if (!keyName) return { available: false };

  const entries = [];

  records.forEach((record) => {
    const raw = getField(record, PERIOD_ALIASES);
    const attendance = getNumber(record, FIELD_ALIASES.attendance);
    const marks = getNumber(record, FIELD_ALIASES.marks);

    if (raw === undefined || raw === null || String(raw).trim() === "") return;
    if (attendance === null && marks === null) return;

    entries.push({ label: String(raw).trim(), attendance, marks });
  });

  const labels = [...new Set(entries.map((entry) => entry.label))];
  if (labels.length < 2) return { available: false };

  const allMonthNames = labels.every((label) => monthIndexOf(label) !== -1);
  const allNumbers = labels.every((label) => Number.isFinite(Number(label)));
  const allDates =
    !allNumbers &&
    labels.every((label) => /\d/.test(label) && Number.isFinite(Date.parse(label)));

  const groups = new Map();

  entries.forEach((entry, index) => {
    let group;
    let sort;

    if (allMonthNames) {
      sort = monthIndexOf(entry.label);
      group = MONTHS[sort][0].toUpperCase() + MONTHS[sort].slice(1);
    } else if (allNumbers) {
      sort = Number(entry.label);
      group = entry.label;
    } else if (allDates) {
      const date = new Date(Date.parse(entry.label));
      sort = date.getFullYear() * 12 + date.getMonth();
      group = `${MONTHS[date.getMonth()][0].toUpperCase()}${MONTHS[date.getMonth()].slice(1)} ${date.getFullYear()}`;
    } else {
      group = entry.label;
      sort = groups.has(group) ? groups.get(group).sort : index;
    }

    if (!groups.has(group)) groups.set(group, { sort, attendance: [], marks: [] });

    if (entry.attendance !== null) groups.get(group).attendance.push(entry.attendance);
    if (entry.marks !== null) groups.get(group).marks.push(entry.marks);
  });

  if (groups.size < 2) return { available: false };

  const data = [...groups.entries()]
    .sort((a, b) => a[1].sort - b[1].sort)
    .map(([label, group]) => ({
      label,
      attendance: average(group.attendance),
      marks: average(group.marks),
    }))
    .slice(-24);

  const field = keyName.charAt(0).toUpperCase() + keyName.slice(1).toLowerCase();

  return { available: true, field, data };
};

// Average attendance for each period (used by the Attendance analysis page).
const buildTrend = (records) => {
  const series = buildPeriodSeries(records);
  if (!series.available) return series;

  const data = series.data
    .filter((point) => point.attendance !== null)
    .map((point) => ({ label: point.label, value: point.attendance }));

  if (data.length < 2) return { available: false };

  return { available: true, field: series.field, data };
};

const buildAttendanceMetrics = (records) => {
  const pairs = records.map((record) => ({
    attendance: getNumber(record, FIELD_ALIASES.attendance),
    previous: getNumber(record, FIELD_ALIASES.previousAttendance),
    marks: getNumber(record, FIELD_ALIASES.marks),
  }));

  const attendance = pairs.map((p) => p.attendance).filter((v) => v !== null);

  // "Declining" can only be counted when the data has an earlier value.
  const withPrevious = pairs.filter((p) => p.attendance !== null && p.previous !== null);

  const lowGroup = pairs.filter(
    (p) => p.attendance !== null && p.attendance < ATTENDANCE_THRESHOLD && p.marks !== null,
  );
  const okGroup = pairs.filter(
    (p) => p.attendance !== null && p.attendance >= ATTENDANCE_THRESHOLD && p.marks !== null,
  );

  const base = buildMetrics(records, []);

  return {
    totalRecords: records.length,
    recordsWithAttendance: attendance.length,
    averageAttendance: average(attendance),
    threshold: ATTENDANCE_THRESHOLD,
    belowThreshold: attendance.filter((v) => v < ATTENDANCE_THRESHOLD).length,
    critical: attendance.filter((v) => v < CRITICAL_THRESHOLD).length,
    declining:
      withPrevious.length > 0
        ? withPrevious.filter((p) => p.attendance < p.previous).length
        : null,
    trend: buildTrend(records),
    attendanceDistribution: base.attendanceDistribution,
    marksDistribution: base.marksDistribution,
    relationship: {
      lowCount: lowGroup.length,
      otherCount: okGroup.length,
      lowAverageMarks: average(lowGroup.map((p) => p.marks)),
      otherAverageMarks: average(okGroup.map((p) => p.marks)),
    },
  };
};

// Text for the AI insight card on the attendance page.
const buildAttendanceInsights = (result, metrics) => {
  const aiAttendance = getTextFromResult(result, [
    "attendanceInsights",
    "attendanceInsight",
    "attendanceAnalysis",
  ]);

  const aiEngagement = getTextFromResult(result, [
    "engagementPatterns",
    "behaviorInsights",
    "behaviourInsights",
    "behaviorSummary",
    "behaviourSummary",
    "engagementInsights",
  ]);

  const dataAttendance =
    metrics.averageAttendance !== null
      ? `Average attendance is ${metrics.averageAttendance}%. ${metrics.belowThreshold} student records have attendance below ${metrics.threshold}%.`
      : "Attendance values are not available in a recognized numeric column.";

  const r = metrics.relationship;
  const relationship =
    r.lowAverageMarks !== null && r.otherAverageMarks !== null
      ? `Students below ${metrics.threshold}% attendance (${r.lowCount}) average ${r.lowAverageMarks} in exams, compared with ${r.otherAverageMarks} for students at or above ${metrics.threshold}% (${r.otherCount}).`
      : null;

  return {
    attendance: aiAttendance
      ? { text: aiAttendance, source: "ai" }
      : { text: dataAttendance, source: "data" },
    engagement: aiEngagement ? { text: aiEngagement, source: "ai" } : null,
    relationship,
  };
};

// One row per record, lowest attendance first (used by "Export data").
const getAttendanceRows = (records) =>
  records
    .map((record, index) => {
      const attendance = getNumber(record, FIELD_ALIASES.attendance);

      return {
        id: getText(record, FIELD_ALIASES.studentId, `Record ${index + 1}`),
        name: getText(record, FIELD_ALIASES.studentName, `Student ${index + 1}`),
        department: getText(record, FIELD_ALIASES.department, ""),
        attendance,
        marks: getNumber(record, FIELD_ALIASES.marks),
        status:
          attendance === null
            ? "Not available"
            : attendance < CRITICAL_THRESHOLD
              ? "Critical"
              : attendance < ATTENDANCE_THRESHOLD
                ? `Below ${ATTENDANCE_THRESHOLD}%`
                : "On track",
      };
    })
    .filter((row) => row.attendance !== null)
    .sort((a, b) => a.attendance - b.attendance);

module.exports = {
  buildStudents,
  buildMetrics,
  buildInsights,
  buildAttendanceMetrics,
  buildAttendanceInsights,
  getAttendanceRows,
  // shared helpers used by the other insight pages
  FIELD_ALIASES,
  getNumber,
  getText,
  getTextFromResult,
  getIndicators,
  getAssignmentRate,
  buildPeriodSeries,
  average,
};