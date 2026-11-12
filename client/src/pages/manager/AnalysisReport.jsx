import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
// Change this path if you save InsightParts.jsx somewhere else.
import {
  BarChart,
  InsightBlock,
  MultiLineChart,
  LineChart,
  StatCard,
  formatNumber,
} from "../../components/manager/InsightParts";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  Download,
  FileDown,
  GraduationCap,
  LoaderCircle,
  RefreshCw,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
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
  Low: "bg-emerald-50 text-emerald-700",
  Review: "bg-slate-100 text-slate-600",
};

// Icon and color for each behavior card the server can send.
const BEHAVIOR_CARD_STYLES = {
  irregularAttendance: { icon: CalendarDays, tone: "indigo" },
  lowEngagement: { icon: TrendingDown, tone: "orange" },
  stable: { icon: Activity, tone: "teal" },
  onTrack: { icon: Users, tone: "teal" },
  improving: { icon: TrendingUp, tone: "purple" },
  strongAttendance: { icon: TrendingUp, tone: "purple" },
};

const getInitials = (name) =>
  String(name || "")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const formatDate = (value) => {
  if (!value) return "Date unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

/* ---------------- small parts ---------------- */

function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        <Icon size={19} />
      </div>
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h2>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

// Card with the AI text of one section.
function InsightCard({ blocks, note, extra }) {
  const visible = blocks.filter((block) => block.item);
  const fromAI = visible.some((block) => block.item.source === "ai");

  return (
    <div className="rounded-2xl border border-indigo-100 bg-[#f6f7fe] p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100/70 text-indigo-600">
          <Sparkles size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-600">
            {fromAI ? "AI-generated insight" : "Data summary"}
          </p>

          <div className="mt-3 space-y-4">
            {visible.map((block) => (
              <InsightBlock key={block.label} label={block.label} item={block.item} />
            ))}
          </div>

          {extra && (
            <div className="mt-4 rounded-xl border border-indigo-100 bg-white/70 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                From the uploaded data
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{extra}</p>
            </div>
          )}

          {note && <p className="mt-4 text-sm text-slate-400">{note}</p>}
        </div>
      </div>
    </div>
  );
}

/* ---------------- page ---------------- */

export default function AnalysisReport() {
  const { analysisId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [students, setStudents] = useState([]);
  const [counts, setCounts] = useState({ all: 0, high: 0, medium: 0, other: 0 });
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
  const [downloading, setDownloading] = useState(false);

  const request = useCallback(
    async (path, params = {}) => {
      const query = new URLSearchParams();

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") query.set(key, value);
      });

      const response = await fetch(
        `${API_URL}/analysis-history/${encodeURIComponent(analysisId)}/${path}?${query.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.message || "Something went wrong.");
      }

      return json;
    },
    [token, analysisId],
  );

  // The whole report (summary, attendance, behavior, academic)
  const loadReport = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setData(await request("details"));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // Wait a little after typing before searching.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchText.trim());
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText]);

  // The student list, one page at a time
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setStudentsLoading(true);
      setStudentsError("");

      try {
        const json = await request("students", {
          page,
          limit: PAGE_SIZE,
          search,
          priority,
        });

        if (cancelled) return;

        setStudents(json.students);
        setCounts(json.counts);
        setPagination(json.pagination);
      } catch (err) {
        if (!cancelled) setStudentsError(err.message);
      } finally {
        if (!cancelled) setStudentsLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [request, page, search, priority]);

  const downloadCSV = async () => {
    setDownloading(true);

    try {
      const json = await request("students", { all: "true", search, priority });

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

      const rows = json.students.map((student) => [
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
      link.download = `analysis-report-${data?.report?.displayId || json.datasetName}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <LoaderCircle className="mx-auto animate-spin text-indigo-600" size={34} />
          <p className="mt-4 text-sm text-slate-500">Loading the saved report...</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-[60vh] px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto text-red-500" size={38} />
          <h1 className="mt-4 text-xl font-semibold text-slate-900">Analysis report</h1>
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
              onClick={() => navigate("/manager/analysis-history")}
              className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to Analysis history
            </button>
          </div>
        </div>
      </main>
    );
  }

  const { report, summary, overview, attendance, behavior, academic } = data;
  const att = attendance.metrics;
  const beh = behavior.metrics;
  const aca = academic.metrics;
  const startIndex = (pagination.page - 1) * pagination.limit;

  const filterChips = [
    { value: "all", label: "All", count: counts.all },
    { value: "High", label: "High", count: counts.high },
    { value: "Medium", label: "Medium", count: counts.medium },
    { value: "Other", label: "Other", count: counts.other },
  ];

  return (
    <main className="min-h-screen bg-[#fafafc] px-5 py-8 sm:px-8 lg:px-10 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto max-w-[1600px]">
        {/* Heading */}
        <div className="mb-6 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <button
              type="button"
              onClick={() => navigate("/manager/analysis-history")}
              className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 print:hidden"
            >
              ← Back to Analysis history
            </button>

            <p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-600">
              Analysis / Report {report.displayId && `· ${report.displayId}`}
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">
              AI analysis report
            </h1>

            <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <span>{report.datasetName}</span>
              <span>·</span>
              <span>{formatNumber(report.students)} students</span>
              <span>·</span>
              <span>{formatDate(report.date)}</span>
              <span>·</span>
              <span>Created by {report.createdBy}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 print:hidden">
            <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
              <CheckCircle2 size={15} />
              Completed
            </span>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              <FileDown size={17} />
              Save as PDF
            </button>

            <button
              type="button"
              onClick={downloadCSV}
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
            >
              {downloading ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <Download size={17} />
              )}
              Download CSV
            </button>
          </div>
        </div>

        {/* Notice */}
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 px-5 py-4 text-sm leading-6 text-indigo-800">
          <Sparkles className="mt-0.5 shrink-0" size={18} />
          <p>
            This report was saved on {formatDate(report.date)}. It uses the saved AI analysis
            and the student records of that upload. Indicators support human review and are
            not definitive judgments about students.
          </p>
        </div>

        {/* Executive summary */}
        <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-5 flex items-center gap-3">
            <Sparkles className="text-indigo-600" size={22} />
            <span className="rounded-md bg-indigo-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-indigo-600">
              {summary.source === "ai" ? "Executive summary" : "Summary"}
            </span>
          </div>

          <ul className="max-w-5xl space-y-3">
            {summary.points.map((point, index) => (
              <li
                key={`${index}-${point}`}
                className="flex items-start gap-3 text-sm leading-6 text-slate-700 sm:text-base"
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-600" />
                <span>{point}</span>
              </li>
            ))}
          </ul>

          <div className="mt-7 grid grid-cols-2 gap-5 border-t border-slate-200 pt-6 lg:grid-cols-5">
            {[
              ["Students analyzed", overview.totalStudents],
              ["Requiring review", overview.reviewCount],
              ["High priority", overview.highCount],
              [`Attendance below ${overview.attendanceThreshold}%`, overview.attendanceConcerns],
              [`Marks below ${overview.academicThreshold}`, overview.academicConcerns],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-2xl font-semibold text-slate-900">{formatNumber(value)}</p>
                <p className="mt-1 text-sm text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Attendance */}
        <section className="mb-10">
          <SectionTitle
            icon={CalendarDays}
            title="Attendance"
            subtitle="Attendance patterns across the uploaded records"
          />

          <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={CalendarDays}
              tone="indigo"
              value={att.averageAttendance === null ? "N/A" : `${att.averageAttendance}%`}
              label="Average attendance"
              description="Across available records"
            />
            <StatCard
              icon={AlertCircle}
              tone="red"
              value={formatNumber(att.belowThreshold)}
              label="Below threshold"
              description={`Below ${att.threshold}% attendance`}
            />
            {att.declining !== null ? (
              <StatCard
                icon={TrendingDown}
                tone="orange"
                value={formatNumber(att.declining)}
                label="Declining attendance"
                description="Lower than the previous value"
              />
            ) : (
              <StatCard
                icon={AlertTriangle}
                tone="orange"
                value={formatNumber(att.critical)}
                label="Critical attendance"
                description="Below 50% attendance"
              />
            )}
            <StatCard
              icon={Users}
              tone="teal"
              value={formatNumber(att.totalRecords)}
              label="Records analyzed"
              description="Student records"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {att.trend.available ? (
              <LineChart
                title="Attendance trends"
                subtitle={`Average attendance by ${att.trend.field.toLowerCase()}`}
                data={att.trend.data}
              />
            ) : (
              <BarChart
                title="Attendance distribution"
                subtitle="Number of students in each attendance range"
                data={att.attendanceDistribution}
                palette="teal"
              />
            )}

            <InsightCard
              blocks={[{ label: "Attendance", item: attendance.insights.attendance }]}
              extra={attendance.insights.relationship}
            />
          </div>
        </section>

        {/* Behavior */}
        <section className="mb-10">
          <SectionTitle
            icon={BrainCircuit}
            title="Behavior"
            subtitle="Engagement patterns inferred from attendance, marks and assignments"
          />

          <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {beh.cards.map((card) => {
              const style = BEHAVIOR_CARD_STYLES[card.key] || { icon: Users, tone: "indigo" };

              return (
                <StatCard
                  key={card.key}
                  icon={style.icon}
                  tone={style.tone}
                  value={card.value === null ? "N/A" : formatNumber(card.value)}
                  label={card.label}
                  description={card.description}
                />
              );
            })}
          </div>

          <div className="mb-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
            {beh.trend.available ? (
              <MultiLineChart
                title="Attendance and performance"
                subtitle={`Average attendance and exam marks by ${beh.trend.field.toLowerCase()}`}
                labels={beh.trend.data.map((point) => point.label)}
                series={[
                  {
                    name: "Attendance",
                    color: "#14a58f",
                    values: beh.trend.data.map((point) => point.attendance),
                  },
                  {
                    name: "Performance",
                    color: "#5269d6",
                    values: beh.trend.data.map((point) => point.marks),
                  },
                ]}
              />
            ) : (
              <BarChart
                title="Attendance and performance"
                subtitle="Average exam marks for students in each attendance range"
                data={beh.marksByAttendance}
                emptyText="Attendance and marks are both needed for this chart."
              />
            )}

            <BarChart
              title="Engagement indicators"
              subtitle="Number of students showing each indicator"
              data={beh.indicatorGroups}
              palette="teal"
              emptyText="No engagement indicators were found."
            />
          </div>

          <InsightCard
            blocks={[{ label: "Engagement patterns", item: behavior.insights.engagement }]}
            note="Behavioral insights are inferred and should be reviewed by academic staff. They are signals, not proof of a student's behavior."
          />
        </section>

        {/* Academic */}
        <section className="mb-10">
          <SectionTitle
            icon={GraduationCap}
            title="Academic performance"
            subtitle="Examination results across the uploaded records"
          />

          <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={GraduationCap}
              tone="indigo"
              value={aca.averageMarks === null ? "N/A" : `${aca.averageMarks}%`}
              label="Average exam score"
              description="Available results"
            />
            <StatCard
              icon={TrendingUp}
              tone="teal"
              value={aca.highest === null ? "N/A" : aca.highest}
              label="Highest score"
              description="Best result in the data"
            />
            <StatCard
              icon={TrendingDown}
              tone="orange"
              value={aca.lowest === null ? "N/A" : aca.lowest}
              label="Lowest score"
              description="Lowest result in the data"
            />
            <StatCard
              icon={AlertCircle}
              tone="red"
              value={formatNumber(aca.belowThreshold)}
              label="Marks below threshold"
              description={`Marks below ${aca.threshold}`}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <BarChart
              title="Performance distribution"
              subtitle="Distribution of exam marks across the uploaded records"
              data={aca.marksDistribution}
            />

            <InsightCard blocks={[{ label: "Academic performance", item: academic.insight }]} />
          </div>
        </section>

        {/* Students */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 px-7 py-6 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                Students requiring review
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Indicators are signals for human review, not definitive risk classifications.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 print:hidden">
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
            <table className="w-full min-w-[950px] border-collapse text-left">
              <thead>
                <tr className="border-y border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-7 py-4">Student</th>
                  <th className="px-4 py-4">Attendance</th>
                  <th className="px-4 py-4">Marks</th>
                  <th className="px-4 py-4">Academic status</th>
                  <th className="px-4 py-4">Indicators</th>
                  <th className="px-7 py-4">Priority</th>
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
                          <p className="text-sm font-semibold text-slate-900">{student.name}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {student.id}
                            {student.department ? ` · ${student.department}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`text-sm ${
                          student.attendance !== null && student.attendance < 60
                            ? "font-semibold text-red-500"
                            : "text-slate-600"
                        }`}
                      >
                        {student.attendance === null ? "Not available" : `${student.attendance}%`}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-600">
                      {student.marks === null ? "Not available" : student.marks}
                    </td>

                    <td className="px-4 py-4">
                      {student.academicStatus === "Needs review" ||
                      student.academicStatus === "Declining" ? (
                        <span className="inline-flex items-center gap-1.5 text-sm text-orange-500">
                          <TrendingDown size={15} />
                          {student.academicStatus}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-600">{student.academicStatus}</span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex max-w-xs flex-wrap gap-1.5">
                        {student.indicators.length ? (
                          student.indicators.map((indicator) => (
                            <span
                              key={indicator}
                              className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600"
                            >
                              {indicator}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-slate-400">None recorded</span>
                        )}
                      </div>
                    </td>

                    <td className="px-7 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${
                          PRIORITY_STYLES[student.priority] || PRIORITY_STYLES.Review
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {student.priority}
                      </span>
                    </td>
                  </tr>
                ))}

                {!studentsLoading && students.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-7 py-14 text-center">
                      <p className="font-semibold text-slate-700">No students to show</p>
                      <p className="mt-1 text-sm text-slate-500">
                        No matching students were found in this report.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {pagination.total > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-200 px-7 py-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
              <p className="text-sm text-slate-500">
                Showing {startIndex + 1}–
                {Math.min(startIndex + pagination.limit, pagination.total)} of {pagination.total}{" "}
                students
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
                  onClick={() => setPage((value) => Math.min(value + 1, pagination.totalPages))}
                  disabled={pagination.page >= pagination.totalPages || studentsLoading}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          <div className="border-t border-slate-200 px-7 py-4 text-xs text-slate-500">
            Source: {report.fileName || report.datasetName}
          </div>
        </section>

        {/* Footer */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <span>
            Analysis ID: {report.displayId} ({report.analysisId})
          </span>
          <span>Report generated from saved data · {formatDate(new Date())}</span>
        </div>
      </div>

      {/* Print layout: hide buttons, keep each section together. */}
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 12mm; }
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          section, article { break-inside: avoid; }
        }
      `}</style>
    </main>
  );
}