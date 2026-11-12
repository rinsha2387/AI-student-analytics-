import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
// Change this path if you save InsightParts.jsx somewhere else.
import {
  BarChart,
  InsightBlock,
  StatCard,
  formatNumber,
} from "../../components/manager/InsightParts";
import {
  Activity,
  AlertCircle,
  Download,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";

const API_URL = "http://localhost:5000/api";
const STORAGE_KEY = "financialAssumptions";

// ₹12.4L, ₹1.25Cr, ₹85,000
const formatShort = (value) => {
  if (value === null || value === undefined) return "N/A";
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
};

const formatFull = (value) =>
  value === null || value === undefined
    ? "—"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(value);

const getInitials = (name) =>
  String(name || "")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const AVATAR_COLORS = [
  "bg-indigo-50 text-indigo-600",
  "bg-teal-50 text-teal-600",
  "bg-purple-50 text-purple-600",
  "bg-sky-50 text-sky-600",
  "bg-rose-50 text-rose-600",
];

// What the 4th card says about where the amounts come from.
const dataSourceCard = (metrics) => {
  if (metrics.atRiskCount === 0) {
    return { value: "Not needed", description: "No students are near dropout" };
  }

  switch (metrics.dataSource) {
    case "dataset":
      return { value: "From dataset", description: "Verify against records" };
    case "mixed":
      return { value: "Partly estimated", description: "Dataset fees plus your averages" };
    case "assumed":
      return { value: "Estimated", description: "Based on the averages you entered" };
    default:
      return { value: "Not available", description: "Enter an average fee below" };
  }
};

// Reads the saved averages (kept in this browser).
const loadSavedAssumptions = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      annualFee: saved.annualFee ?? "",
      yearsLeft: saved.yearsLeft ?? "",
    };
  } catch {
    return { annualFee: "", yearsLeft: "" };
  }
};

export default function FinancialImpact() {
  const { datasetId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  // What the manager typed, and what is sent to the server (after a short wait).
  const [inputs, setInputs] = useState(loadSavedAssumptions);
  const [applied, setApplied] = useState(loadSavedAssumptions);

  useEffect(() => {
    const timer = setTimeout(() => {
      setApplied(inputs);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
      } catch {
        // ignore storage errors
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [inputs]);

  const request = useCallback(
    async (path) => {
      const query = new URLSearchParams();

      if (datasetId) query.set("datasetId", datasetId);
      if (applied.annualFee !== "") query.set("annualFee", applied.annualFee);
      if (applied.yearsLeft !== "") query.set("yearsLeft", applied.yearsLeft);

      const response = await fetch(
        `${API_URL}/financial-impact/${path}?${query.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Something went wrong.");
      }

      return data;
    },
    [token, datasetId, applied],
  );

  const loadSummary = useCallback(async () => {
    setRefreshing(true);
    setError("");

    try {
      setSummary(await request("summary"));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
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
        "Priority",
        "Indicators",
        "Fee Per Year",
        "Years Left",
        "Estimated Loss",
        "Basis",
      ];

      const rows = data.rows.map((row) => [
        row.id,
        row.name,
        row.department,
        row.priority,
        row.indicators.join("; "),
        row.fee ?? "",
        row.years ?? "",
        row.loss ?? "",
        row.source,
      ]);

      const escapeCSV = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

      const csv = [headers, ...rows]
        .map((row) => row.map(escapeCSV).join(","))
        .join("\r\n");

      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `financial-impact-${data.datasetName}.csv`;
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
          <p className="mt-4 text-sm text-slate-500">Loading financial impact...</p>
        </div>
      </main>
    );
  }

  if (error && !summary) {
    return (
      <main className="min-h-[60vh] px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto text-red-500" size={38} />
          <h1 className="mt-4 text-xl font-semibold text-slate-900">Financial impact analysis</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">{error}</p>

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
  const sourceCard = dataSourceCard(metrics);
  const fromAI = insights.financial.source === "ai";

  return (
    <main className="min-h-screen bg-[#fafafc] px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1600px]">
        {/* Heading */}
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-600">
              Financial intelligence
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
              Financial impact analysis
            </h1>
            <p className="mt-3 text-sm text-slate-500">
              Estimated revenue at risk from students who may leave, based only on
              the data available in the dataset.
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

        {error && (
          <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className={refreshing ? "opacity-70 transition" : "transition"}>
          {/* Stat cards */}
          <section className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Wallet}
              tone="indigo"
              value={formatShort(metrics.estimatedLoss)}
              label="Estimated revenue at risk"
              description={
                metrics.estimatedLoss === null
                  ? "Enter an average fee below"
                  : metrics.unpricedCount > 0
                    ? `${metrics.unpricedCount} students without fee data left out`
                    : "From students near dropout"
              }
            />
            <StatCard
              icon={Users}
              tone="orange"
              value={formatNumber(metrics.atRiskCount)}
              label="Students near dropout"
              description="High priority"
            />
            <StatCard
              icon={AlertCircle}
              tone="red"
              value={formatNumber(metrics.reviewCount)}
              label="Academic indicators"
              description="For human review"
            />
            <StatCard
              icon={Activity}
              tone="teal"
              value={sourceCard.value}
              label="Financial data"
              description={sourceCard.description}
            />
          </section>

          {/* Estimate settings */}
          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div className="max-w-xl">
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                  Estimate settings
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Used only for students whose fee or years left are not in the
                  dataset. They are saved in this browser.
                </p>
              </div>

              <div className="flex flex-wrap items-end gap-4">
                <label className="text-xs font-medium text-slate-500">
                  Average fee per year (₹)
                  <input
                    type="number"
                    min="0"
                    value={inputs.annualFee}
                    onChange={(event) =>
                      setInputs((value) => ({ ...value, annualFee: event.target.value }))
                    }
                    placeholder="e.g. 100000"
                    className="mt-1 block w-48 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500"
                  />
                </label>

                <label className="text-xs font-medium text-slate-500">
                  Average years left
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={inputs.yearsLeft}
                    onChange={(event) =>
                      setInputs((value) => ({ ...value, yearsLeft: event.target.value }))
                    }
                    placeholder="e.g. 2"
                    className="mt-1 block w-36 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500"
                  />
                </label>
              </div>
            </div>
          </section>

          {/* Charts */}
          <section className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
            <BarChart
              title={metrics.lossByGroup.title}
              subtitle={metrics.lossByGroup.subtitle}
              data={metrics.lossByGroup.data}
              emptyText="No students near dropout to show."
            />

            <BarChart
              title="Students by risk level"
              subtitle="How many students are at each priority level"
              data={metrics.riskLevels}
              palette="teal"
              emptyText="No student data available."
            />
          </section>

          {/* Students near dropout */}
          {metrics.topStudents.length > 0 && (
            <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="px-7 py-6">
                <h2 className="text-lg font-semibold text-slate-900">Students near dropout</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Highest estimated loss first. Use "Export data" for the full list.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left">
                  <thead>
                    <tr className="border-y border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-7 py-4">Student</th>
                      <th className="px-7 py-4">Indicators</th>
                      <th className="px-7 py-4">Fee per year</th>
                      <th className="px-7 py-4">Years left</th>
                      <th className="px-7 py-4 text-right">Estimated loss</th>
                    </tr>
                  </thead>

                  <tbody>
                    {metrics.topStudents.map((student, index) => (
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

                        <td className="px-7 py-4 text-sm text-slate-600">
                          {student.indicators.length}{" "}
                          {student.indicators.length === 1 ? "indicator" : "indicators"}
                        </td>

                        <td className="px-7 py-4 text-sm text-slate-600">
                          {formatFull(student.fee)}
                        </td>

                        <td className="px-7 py-4 text-sm text-slate-600">
                          {student.years ?? "—"}
                        </td>

                        <td className="px-7 py-4 text-right">
                          <span
                            className={`text-sm ${
                              student.loss === null
                                ? "text-slate-400"
                                : "font-semibold text-red-500"
                            }`}
                          >
                            {formatFull(student.loss)}
                          </span>
                          {student.source === "assumed" && (
                            <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
                              est.
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

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
                  Interpret financial data in context
                </h2>

                <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <InsightBlock label="Financial impact" item={insights.financial} />
                  <InsightBlock
                    label="How this estimate works"
                    item={{ text: insights.method }}
                  />
                </div>

                <p className="mt-5 text-xs text-slate-400">
                  Financial analysis is based only on financial information
                  available in the uploaded dataset. Verify amounts with
                  authorized records.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-10 flex flex-col justify-between gap-2 border-t border-slate-200 pt-5 text-xs text-slate-400 sm:flex-row">
          <span>© 2026 AI Student Analytics</span>
          <span>Insights support human judgment · {summary.dataset.name}</span>
        </div>
      </div>
    </main>
  );
}