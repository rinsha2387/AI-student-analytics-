import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
// Change this path if you save InsightParts.jsx somewhere else.
import {
  BarChart,
  InsightBlock,
  LineChart,
  StatCard,
  formatNumber,
} from "../../components/manager/InsightParts";
import {
  AlertCircle,
  AlertTriangle,
  CalendarDays,
  Download,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  TrendingDown,
  Users,
} from "lucide-react";

const API_URL = "http://localhost:5000/api";

export default function AttendanceAnalytics() {
  const { datasetId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  const request = useCallback(
    async (path) => {
      const query = datasetId ? `?datasetId=${encodeURIComponent(datasetId)}` : "";

      const response = await fetch(`${API_URL}/attendance-analytics/${path}${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Something went wrong.");
      }

      return data;
    },
    [token, datasetId],
  );

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setSummary(await request("summary"));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const exportCSV = async () => {
    setExporting(true);

    try {
      const data = await request("export");

      const headers = [
        "Student ID",
        "Student Name",
        "Department",
        "Attendance (%)",
        "Marks",
        "Attendance Status",
      ];

      const rows = data.rows.map((row) => [
        row.id,
        row.name,
        row.department,
        row.attendance ?? "",
        row.marks ?? "",
        row.status,
      ]);

      const escapeCSV = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

      const csv = [headers, ...rows]
        .map((row) => row.map(escapeCSV).join(","))
        .join("\r\n");

      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `attendance-${data.datasetName}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <LoaderCircle className="mx-auto animate-spin text-indigo-600" size={34} />
          <p className="mt-4 text-sm text-slate-500">Loading attendance analysis...</p>
        </div>
      </main>
    );
  }

  if (error || !summary) {
    return (
      <main className="min-h-[60vh] px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto text-red-500" size={38} />
          <h1 className="mt-4 text-xl font-semibold text-slate-900">Attendance analysis</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
            {error || "No data is available."}
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
  const fromAI = insights.attendance.source === "ai";
  const trend = metrics.trend;

  return (
    <main className="min-h-screen bg-[#fafafc] px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1600px]">
        {/* Heading */}
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-600">
              Attendance intelligence
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
              Attendance analysis
            </h1>
            <p className="mt-3 text-sm text-slate-500">
              Explore attendance patterns and their relationship to academic outcomes.
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
            icon={CalendarDays}
            tone="indigo"
            value={metrics.averageAttendance === null ? "N/A" : `${metrics.averageAttendance}%`}
            label="Average attendance"
            description="Across available records"
          />
          <StatCard
            icon={AlertCircle}
            tone="red"
            value={formatNumber(metrics.belowThreshold)}
            label="Below threshold"
            description={`Below ${metrics.threshold}% attendance`}
          />

          {metrics.declining !== null ? (
            <StatCard
              icon={TrendingDown}
              tone="orange"
              value={formatNumber(metrics.declining)}
              label="Declining attendance"
              description="Lower than the previous value"
            />
          ) : (
            <StatCard
              icon={AlertTriangle}
              tone="orange"
              value={formatNumber(metrics.critical)}
              label="Critical attendance"
              description="Below 50% attendance"
            />
          )}

          <StatCard
            icon={Users}
            tone="teal"
            value={formatNumber(metrics.totalRecords)}
            label="Records analyzed"
            description="Student records"
          />
        </section>

        {/* Charts */}
        <section className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
          {trend.available ? (
            <LineChart
              title="Attendance trends"
              subtitle={`Average attendance by ${trend.field.toLowerCase()}`}
              data={trend.data}
            />
          ) : (
            <BarChart
              title="Attendance distribution"
              subtitle="Number of students in each attendance range"
              data={metrics.attendanceDistribution}
              palette="teal"
            />
          )}

          <BarChart
            title="Performance distribution"
            subtitle="Distribution of exam marks across the uploaded records"
            data={metrics.marksDistribution}
          />
        </section>

        {/* AI insight */}
        <section className="rounded-2xl border border-indigo-100 bg-[#f6f7fe] p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100/70 text-indigo-600">
              <Sparkles size={20} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-indigo-600">
                {fromAI ? "AI-generated insight" : "Data summary"}
              </p>
              <h2 className="mt-2 text-lg font-medium text-slate-900">
                Attendance and academic engagement
              </h2>

              <div
                className={`mt-4 grid grid-cols-1 gap-5 ${
                  insights.engagement ? "lg:grid-cols-2" : ""
                }`}
              >
                <InsightBlock label="Attendance" item={insights.attendance} />

                {insights.engagement && (
                  <InsightBlock
                    label="Engagement patterns"
                    item={insights.engagement}
                    note="Behavioral insights are inferred and should be reviewed by academic staff."
                  />
                )}
              </div>

              {insights.relationship && (
                <div className="mt-5 rounded-xl border border-indigo-100 bg-white/70 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    From the uploaded data
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {insights.relationship}
                  </p>
                </div>
              )}

              <p className="mt-5 text-xs text-slate-400">
                Insights support human review. Check the source data and each
                student's circumstances before taking action.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-10 flex flex-col justify-between gap-2 border-t border-slate-200 pt-5 text-xs text-slate-400 sm:flex-row">
          <span>© 2026 AI Student Analytics</span>
          <span>Insights support human judgment · {summary.dataset.name}</span>
        </div>
      </div>
    </main>
  );
}