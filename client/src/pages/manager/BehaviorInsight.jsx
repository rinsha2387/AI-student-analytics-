import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
// Change this path if you save InsightParts.jsx somewhere else.
import {
  BarChart,
  InsightBlock,
  MultiLineChart,
  StatCard,
  formatNumber,
} from "../../components/manager/InsightParts";
import {
  Activity,
  AlertCircle,
  CalendarDays,
  Download,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

const API_URL = "http://localhost:5000/api";

// Icon and color for each card the server can send.
const CARD_STYLES = {
  irregularAttendance: { icon: CalendarDays, tone: "indigo" },
  lowEngagement: { icon: TrendingDown, tone: "orange" },
  stable: { icon: Activity, tone: "teal" },
  onTrack: { icon: Users, tone: "teal" },
  improving: { icon: TrendingUp, tone: "purple" },
  strongAttendance: { icon: TrendingUp, tone: "purple" },
};

export default function BehaviorInsights() {
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

      const response = await fetch(`${API_URL}/behavior-insights/${path}${query}`, {
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
        "Assignment Completion (%)",
        "Indicators",
        "Pattern",
      ];

      const rows = data.rows.map((row) => [
        row.id,
        row.name,
        row.department,
        row.attendance ?? "",
        row.marks ?? "",
        row.assignmentRate ?? "",
        row.indicators.join("; "),
        row.pattern,
      ]);

      const escapeCSV = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

      const csv = [headers, ...rows]
        .map((row) => row.map(escapeCSV).join(","))
        .join("\r\n");

      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `behavior-insights-${data.datasetName}.csv`;
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
          <p className="mt-4 text-sm text-slate-500">Loading behavioral insights...</p>
        </div>
      </main>
    );
  }

  if (error || !summary) {
    return (
      <main className="min-h-[60vh] px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto text-red-500" size={38} />
          <h1 className="mt-4 text-xl font-semibold text-slate-900">Behavioral insights</h1>
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
  const fromAI = [insights.engagement, insights.attendance, insights.academic].some(
    (item) => item?.source === "ai",
  );
  const blocks = [
    { label: "Engagement patterns", item: insights.engagement },
    { label: "Attendance", item: insights.attendance },
    { label: "Academic performance", item: insights.academic },
  ].filter((block) => block.item);

  const trend = metrics.trend;

  return (
    <main className="min-h-screen bg-[#fafafc] px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1600px]">
        {/* Heading */}
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-600">
              Inferred patterns
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
              Behavioral insights
            </h1>
            <p className="mt-3 text-sm text-slate-500">
              Engagement patterns inferred from available attendance and academic data.
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
          {metrics.cards.map((card) => {
            const style = CARD_STYLES[card.key] || { icon: Users, tone: "indigo" };

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
        </section>

        {/* Charts */}
        <section className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
          {trend.available ? (
            <MultiLineChart
              title="Attendance and performance"
              subtitle={`Average attendance and exam marks by ${trend.field.toLowerCase()}`}
              labels={trend.data.map((point) => point.label)}
              series={[
                {
                  name: "Attendance",
                  color: "#14a58f",
                  values: trend.data.map((point) => point.attendance),
                },
                {
                  name: "Performance",
                  color: "#5269d6",
                  values: trend.data.map((point) => point.marks),
                },
              ]}
            />
          ) : (
            <BarChart
              title="Attendance and performance"
              subtitle="Average exam marks for students in each attendance range"
              data={metrics.marksByAttendance}
              emptyText="Attendance and marks are both needed for this chart."
            />
          )}

          <BarChart
            title="Engagement indicators"
            subtitle="Number of students showing each indicator"
            data={metrics.indicatorGroups}
            palette="teal"
            emptyText="No engagement indicators were found."
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
                  blocks.length === 2
                    ? "lg:grid-cols-2"
                    : blocks.length >= 3
                      ? "lg:grid-cols-3"
                      : ""
                }`}
              >
                {blocks.map((block) => (
                  <InsightBlock key={block.label} label={block.label} item={block.item} />
                ))}
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
                Behavioral insights are inferred and should be reviewed by academic
                staff. They are signals, not proof of a student's behavior.
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