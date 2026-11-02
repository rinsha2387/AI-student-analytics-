const normalizeHeader = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const FIELD_ALIASES = {
  student_id: [
    "studentid",
    "studentnumber",
    "registrationnumber",
    "registrationno",
    "rollnumber",
    "rollno",
    "admissionnumber",
    "admissionno",
  ],

  student_name: [
    "studentname",
    "fullname",
    "name",
    "nameofstudent",
  ],

  attendance_percentage: [
    "attendance",
    "attendancepercentage",
    "attendancepercent",
    "attendancepct",
    "attendancerate",
    "presentpercentage",
  ],

  exam_marks: [
    "exammark",
    "exammarks",
    "examinationmark",
    "examinationmarks",
    "marksobtained",
    "marksscored",
    "score",
    "testscore",
  ],

  assignments_completed: [
    "assignmentscompleted",
    "completedassignments",
    "taskscompleted",
    "assignmentsdone",
  ],

  total_assignments: [
    "totalassignments",
    "assignmentsassigned",
    "totaltasks",
    "numberofassignments",
  ],

  fees_due: [
    "feesdue",
    "outstandingfees",
    "pendingfees",
    "balancedue",
    "unpaidfees",
    "amountdue",
  ],

  fees_paid: [
    "feespaid",
    "amountpaid",
    "paidfees",
    "totalpaid",
  ],

  total_fees: [
    "totalfees",
    "feespayable",
    "totalfeeamount",
    "totalamountdue",
  ],
};

const detectColumnMappings = (columns = []) => {
  const mappings = {};
  const ambiguousMappings = {};

  for (const [standardField, aliases] of Object.entries(FIELD_ALIASES)) {
    const recognizedAliases = new Set([
      normalizeHeader(standardField),
      ...aliases.map(normalizeHeader),
    ]);

    const matches = columns.filter((column) =>
      recognizedAliases.has(normalizeHeader(column))
    );

    if (matches.length === 1) {
      mappings[standardField] = matches[0];
    } else if (matches.length > 1) {
      ambiguousMappings[standardField] = matches;
    }
  }

  return { mappings, ambiguousMappings };
};

const toNumericValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const cleaned = String(value)
    .trim()
    .replace(/,/g, "")
    .replace(/%$/, "")
    .trim();

  if (!cleaned) return null;

  const number = Number(cleaned);

  return Number.isFinite(number) ? number : null;
};

module.exports = {
  normalizeHeader,
  detectColumnMappings,
  toNumericValue,
};