import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Download,
  FileDown,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  TrendingDown,
} from "lucide-react";

const API_URL = "http://localhost:5000/api";

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

  feesPaid: [
    "feespaid",
    "feepaid",
    "amountpaid",
    "paidfees",
    "totalpaid",
    "totalfeespaid",
    "feespayment",
  ],
};

const getField = (record, aliases) => {
  if (!record || typeof record !== "object") {
    return undefined;
  }

  const normalizedAliases = aliases.map(normalizeKey);

  const matchingKey = Object.keys(record).find((key) =>
    normalizedAliases.includes(normalizeKey(key)),
  );

  return matchingKey === undefined ? undefined : record[matchingKey];
};

const getNumber = (record, aliases) => {
  const value = getField(record, aliases);

  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "string" && !value.trim()) {
    return null;
  }

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

    if (key && Array.isArray(result[key])) {
      return result[key];
    }
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

    if (key && result[key] && typeof result[key] === "object") {
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

const formatDate = (value) => {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatCurrency = (value) => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "Not available";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};

const getPriority = (student) => {
  const explicitPriority = getText(
    student,
    ["priority", "riskLevel", "riskCategory", "severity"],
    "",
  ).toLowerCase();

  if (["high", "critical", "very high"].includes(explicitPriority)) {
    return "High";
  }

  if (["medium", "moderate"].includes(explicitPriority)) {
    return "Medium";
  }

  if (["low", "minimal"].includes(explicitPriority)) {
    return "Low";
  }

  const attendance = getNumber(student, FIELD_ALIASES.attendance);

  const marks = getNumber(student, FIELD_ALIASES.marks);

  if (
    (attendance !== null && attendance < 50) ||
    (marks !== null && marks < 35)
  ) {
    return "High";
  }

  if (
    (attendance !== null && attendance < 75) ||
    (marks !== null && marks < 50)
  ) {
    return "Medium";
  }

  return "Review";
};

const getIndicators = (student) => {
  const indicators = [];

  const attendance = getNumber(student, FIELD_ALIASES.attendance);

  const marks = getNumber(student, FIELD_ALIASES.marks);

  if (attendance !== null && attendance < 75) {
    indicators.push("Low attendance");
  }

  if (marks !== null && marks < 50) {
    indicators.push("Low marks");
  }

  const completed = getNumber(student, [
    "assignmentsCompleted",
    "completedAssignments",
  ]);

  const total = getNumber(student, ["totalAssignments", "assignmentsTotal"]);

  if (completed !== null && total !== null && total > 0) {
    if (completed / total < 0.6) {
      indicators.push("Low assignment completion");
    }
  }

  const feesDue = getNumber(student, ["feesDue", "feeDue"]);
  const feesPaid = getNumber(student, ["feesPaid", "feePaid"]);

  if (feesDue !== null && feesDue > 0) {
    indicators.push("Outstanding fees");
  } else if (feesDue === null && feesPaid === null) {
    // No financial information was supplied.
  }

  return indicators;
};

/* ---------- UI helpers (new design) ---------- */

const AVATAR_COLORS = [
  "bg-indigo-50 text-indigo-600",
  "bg-teal-50 text-teal-600",
  "bg-purple-50 text-purple-600",
  "bg-sky-50 text-sky-600",
  "bg-rose-50 text-rose-600",
];

const PRIORITY_STYLES = {
  High: "bg-red-50 text-red-600",
  Medium: "bg-orange-50 text-orange-600",
  Low: "bg-emerald-50 text-emerald-700",
  Review: "bg-slate-100 text-slate-600",
};

const getInitials = (name) =>
  String(name || "")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

function InsightCard({ title, description, linkText, onClick }) {
  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-[15px] font-medium text-slate-900">{title}</h3>

      <p className="mt-3 flex-1 text-sm leading-6 text-slate-500">
        {description}
      </p>

      <button
        type="button"
        onClick={onClick}
        className="mt-5 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-indigo-600 hover:text-indigo-800 print:hidden"
      >
        {linkText}
        <ArrowRight size={15} />
      </button>
    </article>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-2 break-words text-2xl font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

export default function AIAnalysis() {
  const { datasetId: routeDatasetId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 10;

  const formatSummaryPoints = (summary) => {
    if (!summary || typeof summary !== "string") {
      return [];
    }

    // Keep existing bullet points if Gemini already returned them.
    const existingPoints = summary
      .split(/\n+/)
      .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
      .filter(Boolean);

    // If Gemini returned a single paragraph, split it into sentences.
    if (existingPoints.length === 1) {
      return existingPoints[0]
        .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
        .map((point) => point.trim())
        .filter(Boolean);
    }

    return existingPoints;
  };

  const loadReport = useCallback(async () => {
    if (!token) {
      setError("Your session has expired. Please log in again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      let datasetId = routeDatasetId;

      // When the sidebar opens the report without a dataset ID,
      // use the most recent completed analysis from the dashboard API.
      if (!datasetId) {
        const dashboardResponse = await fetch(`${API_URL}/analysis/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const dashboardData = await dashboardResponse.json();

        if (!dashboardResponse.ok || !dashboardData.success) {
          throw new Error(
            dashboardData.message || "Could not find your latest analysis.",
          );
        }

        const latest = dashboardData.latestAnalysis;

        if (!latest || !latest.dataset) {
          throw new Error(
            "No completed analysis is available yet. Upload a dataset and run AI analysis first.",
          );
        }

        datasetId =
          typeof latest.dataset === "object"
            ? latest.dataset._id
            : latest.dataset;
      }

      if (!datasetId) {
        throw new Error("A dataset ID is required to load this report.");
      }

      const response = await fetch(
        `${API_URL}/analysis/dataset/${encodeURIComponent(datasetId)}/latest`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load the report.");
      }

      if (data.analysis?.status !== "completed") {
        throw new Error(
          data.analysis?.status === "failed"
            ? data.analysis.errorMessage || "The latest analysis failed."
            : "The latest analysis is not complete yet. Please try again shortly.",
        );
      }

      setReport({
        dataset: data.dataset,
        analysis: data.analysis,
      });

      // Keep the URL specific to the selected dataset.
      if (!routeDatasetId) {
        navigate(`/manager/ai-analysis/${datasetId}`, { replace: true });
      }
    } catch (err) {
      setError(err.message || "Unable to load the AI report.");
    } finally {
      setLoading(false);
    }
  }, [token, routeDatasetId, navigate]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const dataset = report?.dataset;
  const analysis = report?.analysis;
  const result = analysis?.result || {};
  const records = Array.isArray(dataset?.records) ? dataset.records : [];

  const students = useMemo(() => {
    const aiStudents = getArray(result, [
      "studentsRequiringReview",
      "studentsFlaggedForReview",
      "studentsNeedingReview",
      "highRiskStudents",
      "atRiskStudents",
      "studentsAtRisk",
      "riskStudents",
    ]);

    const mapped = aiStudents.map((student, index) => {
      const studentId = getText(
        student,
        FIELD_ALIASES.studentId,
        `Record ${index + 1}`,
      );

      const matchingRecord = records.find((record) => {
        const recordId = getText(record, FIELD_ALIASES.studentId, "");

        return recordId && recordId === studentId;
      });

      const merged = { ...(matchingRecord || {}), ...student };

      const attendance = getNumber(merged, FIELD_ALIASES.attendance);

      const marks = getNumber(merged, FIELD_ALIASES.marks);

      return {
        id: studentId,
        name: getText(merged, FIELD_ALIASES.studentName, studentId),
        attendance,
        marks,
        academicStatus:
          getText(merged, ["academicStatus", "performanceStatus"], "") ||
          (marks !== null
            ? marks < 50
              ? "Needs review"
              : "Recorded"
            : "Not available"),
        indicators: getIndicators(merged),
        priority: getPriority(merged),
      };
    });

    // If the AI result has no review list, derive review candidates from
    // real dataset records using transparent indicator thresholds.
    if (mapped.length === 0) {
      return records
        .map((record, index) => {
          const attendance = getNumber(record, FIELD_ALIASES.attendance);

          const marks = getNumber(record, FIELD_ALIASES.marks);

          const indicators = getIndicators(record);

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
            attendance,
            marks,
            academicStatus:
              marks === null
                ? "Not available"
                : marks < 50
                  ? "Needs review"
                  : "Recorded",
            indicators,
            priority: getPriority(record),
          };
        })
        .filter((student) => student.indicators.length > 0);
    }

    return mapped;
  }, [result, records]);

  const metrics = useMemo(() => {
    const attendance = records
      .map((record) => getNumber(record, FIELD_ALIASES.attendance))
      .filter((value) => value !== null);

    const marks = records
      .map((record) => getNumber(record, FIELD_ALIASES.marks))
      .filter((value) => value !== null);

    const feesDueValues = records
      .map((record) => getNumber(record, FIELD_ALIASES.feesDue))
      .filter((value) => value !== null);

    const feesPaidValues = records
      .map((record) => getNumber(record, FIELD_ALIASES.feesPaid))
      .filter((value) => value !== null);

    const attendanceConcerns = records.filter((record) => {
      const value = getNumber(record, FIELD_ALIASES.attendance);

      return value !== null && value < 75;
    }).length;

    const academicConcerns = records.filter((record) => {
      const value = getNumber(record, FIELD_ALIASES.marks);

      return value !== null && value < 40;
    }).length;

    const average = (values) =>
      values.length
        ? Number(
            (
              values.reduce((sum, value) => sum + value, 0) / values.length
            ).toFixed(1),
          )
        : null;

    return {
      totalStudents: records.length,
      reviewCount: students.length,
      attendanceConcerns,
      academicConcerns,
      averageAttendance: average(attendance),
      averageMarks: average(marks),
      financialIndicators:
        feesDueValues.length > 0
          ? feesDueValues.reduce((sum, value) => sum + value, 0)
          : null,
      feesPaid:
        feesPaidValues.length > 0
          ? feesPaidValues.reduce((sum, value) => sum + value, 0)
          : null,
    };
  }, [records, students]);

  const executiveSummary =
    getTextFromResult(result, [
      "executiveSummary",
      "summary",
      "overallSummary",
      "managementSummary",
    ]) ||
    "The analysis completed, but no executive summary was returned by the configured AI prompt.";

  const summaryPoints = useMemo(
    () => formatSummaryPoints(executiveSummary),
    [executiveSummary],
  );

  const academicInsights =
    getTextFromResult(result, [
      "academicInsights",
      "academicInsight",
      "academicAnalysis",
    ]) ||
    (metrics.averageMarks !== null
      ? `The average examination mark in this dataset is ${metrics.averageMarks}%. ${metrics.academicConcerns} student records have marks below 50.`
      : "Examination marks are not available in a recognized numeric column.");

  const attendanceInsights =
    getTextFromResult(result, [
      "attendanceInsights",
      "attendanceInsight",
      "attendanceAnalysis",
    ]) ||
    (metrics.averageAttendance !== null
      ? `Average attendance is ${metrics.averageAttendance}%. ${metrics.attendanceConcerns} student records have attendance below 75%.`
      : "Attendance values are not available in a recognized numeric column.");

  const behaviorInsights =
    getTextFromResult(result, [
      "engagementPatterns",
      "behaviorInsights",
      "behaviourInsights",
      "behaviorSummary",
      "behaviourSummary",
      "engagementInsights",
    ]) ||
    "No explicit behavior or engagement summary was returned by the AI analysis. Academic and attendance indicators are shown separately; they are not proof of a student's behavior.";

  const filteredStudents = students.filter((student) => {
    const query = search.toLowerCase();

    return (
      student.name.toLowerCase().includes(query) ||
      student.id.toLowerCase().includes(query) ||
      student.priority.toLowerCase().includes(query)
    );
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [search, routeDatasetId]);

  // Calculate pagination using the filtered students.
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  const startIndex = (currentPage - 1) * studentsPerPage;

  const paginatedStudents = filteredStudents.slice(
    startIndex,
    startIndex + studentsPerPage,
  );

  const downloadCSV = () => {
    const headers = [
      "Student ID",
      "Student Name",
      "Attendance (%)",
      "Marks",
      "Academic Status",
      "Indicators",
      "Priority",
    ];

    const rows = filteredStudents.map((student) => [
      student.id,
      student.name,
      student.attendance ?? "",
      student.marks ?? "",
      student.academicStatus,
      student.indicators.join("; "),
      student.priority,
    ]);

    const escapeCSV = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `ai-analysis-${dataset?._id || "report"}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-white">
        <div className="text-center">
          <LoaderCircle
            className="mx-auto animate-spin text-indigo-600"
            size={34}
          />
          <p className="mt-4 text-sm text-slate-500">
            Loading your saved AI analysis...
          </p>
        </div>
      </main>
    );
  }

  if (error || !report) {
    return (
      <main className="min-h-[60vh] bg-white px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto text-red-500" size={38} />

          <h1 className="mt-4 text-xl font-semibold text-slate-900">
            AI Analysis Report
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
            {error || "No report is available."}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={loadReport}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <RefreshCw size={16} />
              Try again
            </button>

            <button
              onClick={() => navigate("/manager/upload-data")}
              className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Upload dataset
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fafafc] px-5 py-8 sm:px-8 lg:px-10 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto max-w-[1600px]">
        {/* Report heading */}
        <div className="mb-6 flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              AI Analysis Report
            </h1>

            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <span>{dataset.name || dataset.originalFileName}</span>
              <span>·</span>
              <span>{metrics.totalStudents} student records</span>
              <span>·</span>
              <span>
                {formatDate(analysis.completedAt || analysis.updatedAt)}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 print:hidden">
            <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
              <CheckCircle2 size={15} />
              Completed
            </span>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <FileDown size={17} />
              Save as PDF
            </button>

            <button
              onClick={downloadCSV}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Download size={17} />
              Download CSV
            </button>
          </div>
        </div>

        {/* Data notice */}
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 px-5 py-4 text-sm leading-6 text-indigo-800">
          <Sparkles className="mt-0.5 shrink-0" size={18} />
          <p>
            This report uses the saved AI analysis and uploaded student records.
            Risk indicators are intended to support human review, not to make
            definitive judgments about students.
          </p>
        </div>

        {/* Executive summary */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-5 flex items-center gap-2.5">
            <Sparkles className="text-indigo-600" size={20} />
            <h2 className="text-base font-semibold text-slate-900">
              Executive summary
            </h2>
          </div>

          <ul className="max-w-5xl space-y-3">
            {summaryPoints.map((point, index) => (
              <li
                key={`${index}-${point}`}
                className="flex items-start gap-3 text-sm leading-6 text-slate-700"
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-600" />
                <span>{point}</span>
              </li>
            ))}
          </ul>

          <p className="mt-4 text-sm leading-6 text-slate-500">
            Generated from the saved analysis for{" "}
            <strong className="font-semibold text-slate-700">
              {dataset.name || dataset.originalFileName}
            </strong>
            . Review the indicators against the original student records before
            taking action.
          </p>
        </section>

        {/* Stat cards */}
        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
          <StatCard label="Students analyzed" value={metrics.totalStudents} />
          <StatCard label="Requiring review" value={metrics.reviewCount} />
          <StatCard
            label="Attendance concerns"
            value={metrics.attendanceConcerns}
          />
          <StatCard
            label="Academic concerns"
            value={metrics.academicConcerns}
          />
          <StatCard
            label="Avg. attendance"
            value={
              metrics.averageAttendance === null
                ? "Not available"
                : `${metrics.averageAttendance}%`
            }
          />
          <StatCard
            label="Avg. exam marks"
            value={
              metrics.averageMarks === null
                ? "Not available"
                : metrics.averageMarks
            }
          />
          <StatCard
            label="Outstanding fees"
            value={formatCurrency(metrics.financialIndicators)}
          />
          <StatCard label="Fees paid" value={formatCurrency(metrics.feesPaid)} />
        </section>

        {/* Insight cards */}
        <section className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <InsightCard
            title="Academic insights"
            description={academicInsights}
            linkText="Explore academic data"
            onClick={() => navigate("/manager/academic-analytics")}
          />

          <InsightCard
            title="Attendance insights"
            description={attendanceInsights}
            linkText="Explore attendance"
            onClick={() => navigate("/manager/attendance-analytics")}
          />

          <InsightCard
            title="Engagement patterns"
            description={behaviorInsights}
            linkText="Explore patterns"
            onClick={() => navigate("/manager/behavior-insights")}
          />
        </section>

        {/* Students requiring review */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 px-7 py-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Students requiring review
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Indicators are signals for human review, not definitive risk
                classifications.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search students..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 sm:w-52 print:hidden"
              />

              <span className="text-sm font-medium text-slate-500">
                {filteredStudents.length} records
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] border-collapse text-left">
              <thead>
                <tr className="border-y border-slate-200 bg-slate-50/70">
                  {[
                    "Student",
                    "Attendance",
                    "Academic status",
                    "Indicators",
                    "Priority",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-7 py-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500"
                    >
                      {heading}
                    </th>
                  ))}
                  <th className="px-7 py-4 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500 print:hidden">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedStudents.map((student, index) => (
                  <tr
                    key={`${student.id}-${index}`}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                  >
                    <td className="px-7 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                            AVATAR_COLORS[index % AVATAR_COLORS.length]
                          }`}
                        >
                          {getInitials(student.name)}
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {student.name}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {student.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-7 py-4">
                      <span
                        className={`text-sm ${
                          student.attendance !== null && student.attendance < 60
                            ? "font-semibold text-red-500"
                            : "text-slate-600"
                        }`}
                      >
                        {student.attendance === null
                          ? "Not available"
                          : `${student.attendance}%`}
                      </span>
                    </td>

                    <td className="px-7 py-4">
                      {student.academicStatus === "Needs review" ? (
                        <span className="inline-flex items-center gap-1.5 text-sm text-orange-500">
                          <TrendingDown size={15} />
                          {student.academicStatus}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-600">
                          {student.academicStatus}
                        </span>
                      )}
                    </td>

                    <td className="px-7 py-4">
                      <span
                        className="text-sm text-slate-600"
                        title={student.indicators.join(", ")}
                      >
                        {student.indicators.length}
                      </span>
                    </td>

                    <td className="px-7 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${
                          PRIORITY_STYLES[student.priority] ||
                          PRIORITY_STYLES.Review
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {student.priority}
                      </span>
                    </td>

                    <td className="px-7 py-4 text-right print:hidden">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/manager/student-insights?student=${encodeURIComponent(
                              student.id,
                            )}`,
                          )
                        }
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        View details
                        <ArrowRight size={15} />
                      </button>
                    </td>
                  </tr>
                ))}

                {paginatedStudents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Activity className="mx-auto text-slate-300" size={30} />

                      <p className="mt-3 font-semibold text-slate-700">
                        No student records to display
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        No matching review records were found for this report.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredStudents.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-200 px-7 py-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
              <p className="text-sm text-slate-500">
                Showing {startIndex + 1}–
                {Math.min(startIndex + studentsPerPage, filteredStudents.length)}{" "}
                of {filteredStudents.length} students
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="text-sm text-slate-600">
                  Page {currentPage} of {Math.max(totalPages, 1)}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.min(page + 1, totalPages))
                  }
                  disabled={currentPage >= totalPages}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col justify-between gap-3 border-t border-slate-200 px-7 py-4 sm:flex-row sm:items-center">
            <p className="text-xs text-slate-500">
              Source: {dataset.originalFileName || dataset.name}
            </p>

            <button
              onClick={() => navigate("/manager/upload-data")}
              className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 print:hidden"
            >
              Analyze another dataset
              <ArrowRight size={16} />
            </button>
          </div>
        </section>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <span>Analysis ID: {analysis._id}</span>
          <span>
            Report generated from saved data · {formatDate(new Date())}
          </span>
        </div>
      </div>

      {/* Print layout: omit navigation, search, and buttons. */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 12mm;
          }

          body {
            background: white !important;
          }

          aside,
          nav,
          header,
          footer {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .print\\:hidden {
            display: none !important;
          }

          section,
          article {
            break-inside: avoid;
          }
        }
      `}</style>
    </main>
  );
}
