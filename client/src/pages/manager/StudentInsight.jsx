import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Clock3,
  Download,
  GraduationCap,
  LoaderCircle,
  RefreshCw,
  Search,
  Sparkles,
  TrendingDown,
  Users,
  X,
} from "lucide-react";

const API_URL = "http://localhost:5000/api";
const PAGE_SIZE = 10;

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
};

const BAR_COLORS = ["#c9cff4", "#a3aeea", "#7d8be0", "#5269d6"];

const getInitials = (name) =>
  String(name || "")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const formatNumber = (value) =>
  value === null || value === undefined
    ? "Not available"
    : new Intl.NumberFormat("en-IN").format(value);

/* ---------------- small UI parts ---------------- */

function StatCard({ icon: Icon, tone, value, label, description }) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-600",
    red: "bg-red-50 text-red-500",
    orange: "bg-orange-50 text-orange-500",
    purple: "bg-purple-50 text-purple-500",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone]}`}
      >
        <Icon size={21} />
      </div>

      <p className="mt-5 break-words text-[28px] font-semibold leading-none tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-3 text-sm font-semibold text-slate-800">{label}</p>
      <p className="mt-1 text-xs text-slate-400">{description}</p>
    </div>
  );
}

// Simple bar chart (no chart library needed).
function BarChart({ title, subtitle, data }) {
  const max = Math.max(...data.map((item) => item.value), 0);

  // Round the top of the chart up to a clean number.
  const niceMax = (() => {
    if (max <= 0) return 4;
    const rough = max / 4;
    const power = 10 ** Math.floor(Math.log10(rough));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => s >= rough);
    return step * 4;
  })();

  const ticks = [0, 1, 2, 3, 4].map((i) => (niceMax / 4) * i);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
      <p className="mt-1 text-xs text-slate-400">{subtitle}</p>

      <div className="mt-6 flex">
        <div className="relative h-52 w-10 shrink-0">
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute right-2 translate-y-1/2 text-xs text-slate-400"
              style={{ bottom: `${(tick / niceMax) * 100}%` }}
            >
              {Number.isInteger(tick) ? tick : tick.toFixed(1)}
            </span>
          ))}
        </div>

        <div className="relative h-52 flex-1">
          {ticks.map((tick) => (
            <div
              key={tick}
              className="absolute left-0 right-0 border-t border-dashed border-slate-200"
              style={{ bottom: `${(tick / niceMax) * 100}%` }}
            />
          ))}

          <div className="absolute inset-0 flex items-end justify-around px-3">
            {data.map((item, index) => (
              <div
                key={item.label}
                className="flex h-full w-1/5 flex-col items-center justify-end"
              >
                <span className="mb-1 text-[11px] font-medium text-slate-500">
                  {item.value}
                </span>
                <div
                  className="w-full rounded-t-md"
                  style={{
                    height: `${(item.value / niceMax) * 100}%`,
                    background: BAR_COLORS[index % BAR_COLORS.length],
                    minHeight: item.value > 0 ? 4 : 0,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="ml-10 flex justify-around px-3 pt-2 text-xs text-slate-400">
        {data.map((item) => (
          <span key={item.label} className="w-1/5 text-center">
            {item.label}
          </span>
        ))}
      </div>
    </section>
  );
}

function InsightBlock({ label, item }) {
  const [expanded, setExpanded] = useState(false);
  const text = item?.text || "";
  const isLong = text.length > 380;

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p
        className={`mt-1 whitespace-pre-line text-sm leading-6 text-slate-600 ${
          isLong && !expanded ? "line-clamp-3" : ""
        }`}
      >
        {text}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

function StudentModal({ student, onClose }) {
  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-600">
              {getInitials(student.name)}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{student.name}</p>
              <p className="text-xs text-slate-500">
                {student.id}
                {student.department ? ` · ${student.department}` : ""}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs text-slate-400">Priority</dt>
            <dd className="mt-1">
              <span
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${
                  PRIORITY_STYLES[student.priority]
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {student.priority}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Academic status</dt>
            <dd className="mt-1 font-medium text-slate-800">{student.academicStatus}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Attendance</dt>
            <dd className="mt-1 font-medium text-slate-800">
              {student.attendance === null ? "Not available" : `${student.attendance}%`}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Exam marks</dt>
            <dd className="mt-1 font-medium text-slate-800">
              {student.marks === null ? "Not available" : student.marks}
            </dd>
          </div>
        </dl>

        <div className="mt-6">
          <p className="text-xs text-slate-400">Indicators</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {student.indicators.length ? (
              student.indicators.map((indicator) => (
                <span
                  key={indicator}
                  className="rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
                >
                  {indicator}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-400">No indicators recorded</span>
            )}
          </div>
        </div>

        <p className="mt-6 text-xs leading-5 text-slate-400">
          Indicators are signals for human review, not definitive risk
          classifications.
        </p>
      </div>
    </div>
  );
}

/* ---------------- page ---------------- */

export default function StudentInsights() {
  const { datasetId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [summary, setSummary] = useState(null);
  const [summaryError, setSummaryError] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [students, setStudents] = useState([]);
  const [counts, setCounts] = useState({ high: 0, medium: 0 });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentsError, setStudentsError] = useState("");

  const [page, setPage] = useState(1);
  const [priority, setPriority] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState(null);
  const [exporting, setExporting] = useState(false);

  const request = useCallback(
    async (path, params = {}) => {
      const query = new URLSearchParams();

      Object.entries({ ...params, datasetId }).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          query.set(key, value);
        }
      });

      const response = await fetch(
        `${API_URL}/student-insights/${path}?${query.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Something went wrong.");
      }

      return data;
    },
    [token, datasetId],
  );

  // Cards, charts and AI summary
  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError("");

    try {
      setSummary(await request("summary"));
    } catch (error) {
      setSummaryError(error.message);
    } finally {
      setSummaryLoading(false);
    }
  }, [request]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // Wait a little after typing before searching.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchText.trim());
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText]);

  // Student list (High and Medium priority only), one page at a time
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setStudentsLoading(true);
      setStudentsError("");

      try {
        const data = await request("students", {
          page,
          limit: PAGE_SIZE,
          search,
          priority,
        });

        if (cancelled) return;

        setStudents(data.students);
        setCounts(data.counts);
        setPagination(data.pagination);
      } catch (error) {
        if (!cancelled) setStudentsError(error.message);
      } finally {
        if (!cancelled) setStudentsLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [request, page, search, priority]);

  const exportCSV = async () => {
    setExporting(true);

    try {
      const data = await request("students", { all: "true", search, priority });

      const headers = [
        "Student ID",
        "Student Name",
        "Department",
        "Attendance (%)",
        "Marks",
        "Academic Status",
        "Indicators",
        "Priority",
      ];

      const rows = data.students.map((student) => [
        student.id,
        student.name,
        student.department,
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

      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `student-insights-${data.datasetName}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(error.message);
    } finally {
      setExporting(false);
    }
  };

  /* ----- loading and error screens ----- */

  if (summaryLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <LoaderCircle className="mx-auto animate-spin text-indigo-600" size={34} />
          <p className="mt-4 text-sm text-slate-500">Loading student insights...</p>
        </div>
      </main>
    );
  }

  if (summaryError || !summary) {
    return (
      <main className="min-h-[60vh] px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto text-red-500" size={38} />
          <h1 className="mt-4 text-xl font-semibold text-slate-900">Student insights</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
            {summaryError || "No data is available."}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={loadSummary}
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

  const { metrics, insights } = summary;
  const fromAI = insights.overall.source === "ai";
  const startIndex = (pagination.page - 1) * pagination.limit;

  const filterChips = [
    { value: "all", label: "All", count: counts.high + counts.medium },
    { value: "High", label: "High", count: counts.high },
    { value: "Medium", label: "Medium", count: counts.medium },
  ];

  return (
    <main className="min-h-screen bg-[#fafafc] px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1600px]">
        {/* Heading */}
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-600">
              Student intelligence
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
              Student insights
            </h1>
            <p className="mt-3 text-sm text-slate-500">
              A closer look at the students and patterns behind the numbers.
            </p>
          </div>

          <button
            type="button"
            onClick={exportCSV}
            disabled={exporting}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          >
            {exporting ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <Download size={17} />
            )}
            Export data
          </button>
        </div>

        {/* Stat cards */}
        <section className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={GraduationCap}
            tone="indigo"
            value={metrics.averageMarks === null ? "N/A" : `${metrics.averageMarks}%`}
            label="Average exam score"
            description="Available results"
          />
          <StatCard
            icon={AlertTriangle}
            tone="red"
            value={formatNumber(metrics.highCount)}
            label="High priority"
            description="Multiple indicators"
          />
          <StatCard
            icon={Clock3}
            tone="orange"
            value={formatNumber(metrics.mediumCount)}
            label="Medium priority"
            description="For academic review"
          />
          <StatCard
            icon={Users}
            tone="purple"
            value={formatNumber(metrics.totalStudents)}
            label="Students reviewed"
            description="Available records"
          />
        </section>

        {/* Charts */}
        <section className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
          <BarChart
            title="Attendance distribution"
            subtitle="Based on the uploaded attendance values"
            data={metrics.attendanceDistribution}
          />
          <BarChart
            title="Performance distribution"
            subtitle="Distribution of exam marks across the uploaded records"
            data={metrics.marksDistribution}
          />
        </section>

        {/* AI insight */}
        <section className="mb-6 rounded-2xl border border-indigo-100 bg-[#f6f7fe] p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100/70 text-indigo-600">
              <Sparkles size={20} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-indigo-600">
                {fromAI ? "AI-generated insight" : "Data summary"}
              </p>
              <h2 className="mt-2 text-lg font-medium text-slate-900">
                Student performance summary
              </h2>

              <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-3">
                <InsightBlock label="Overall" item={insights.overall} />
                <InsightBlock label="Exam performance" item={insights.academic} />
                <InsightBlock label="Attendance" item={insights.attendance} />
              </div>

              <p className="mt-5 text-xs text-slate-400">
                Insights support human review. Check the source data and each
                student's circumstances before taking action.
              </p>
            </div>
          </div>
        </section>

        {/* Student overview */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 px-7 py-6 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Student overview</h2>
              <p className="mt-1 text-sm text-slate-500">
                Select a student to explore available indicators
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex rounded-lg bg-slate-100 p-1">
                {filterChips.map((chip) => (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => {
                      setPriority(chip.value);
                      setPage(1);
                    }}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                      priority === chip.value
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {chip.label} ({chip.count})
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search students..."
                  className="w-52 rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {studentsError && (
            <div className="mx-7 mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {studentsError}
            </div>
          )}

          <div className={`overflow-x-auto ${studentsLoading ? "opacity-60" : ""}`}>
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-y border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-7 py-4">Student</th>
                  <th className="px-7 py-4">Attendance</th>
                  <th className="px-7 py-4">Academic status</th>
                  <th className="px-7 py-4">Indicators</th>
                  <th className="px-7 py-4">Priority</th>
                  <th className="px-7 py-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {students.map((student, index) => (
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
                            {student.department ? ` · ${student.department}` : ""}
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
                      {student.academicStatus === "Needs review" ||
                      student.academicStatus === "Declining" ? (
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

                    <td className="px-7 py-4 text-sm text-slate-600">
                      {student.indicators.length}{" "}
                      {student.indicators.length === 1 ? "indicator" : "indicators"}
                    </td>

                    <td className="px-7 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${
                          PRIORITY_STYLES[student.priority]
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {student.priority}
                      </span>
                    </td>

                    <td className="px-7 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelected(student)}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        View details
                        <ArrowRight size={15} />
                      </button>
                    </td>
                  </tr>
                ))}

                {!studentsLoading && students.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-7 py-14 text-center">
                      <p className="font-semibold text-slate-700">
                        No high or medium priority students found
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Try a different search or filter.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {pagination.total > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-200 px-7 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing {startIndex + 1}–
                {Math.min(startIndex + pagination.limit, pagination.total)} of{" "}
                {pagination.total} students
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((value) => Math.max(value - 1, 1))}
                  disabled={pagination.page <= 1 || studentsLoading}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="text-sm text-slate-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setPage((value) => Math.min(value + 1, pagination.totalPages))
                  }
                  disabled={pagination.page >= pagination.totalPages || studentsLoading}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>

        <p className="mt-6 text-xs text-slate-400">
          Dataset: {summary.dataset.name}
        </p>
      </div>

      {selected && (
        <StudentModal student={selected} onClose={() => setSelected(null)} />
      )}
    </main>
  );
}