import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/* ------------------------------------------------------------------
   Icons (outside the component so they are not re-created each render)
------------------------------------------------------------------- */
const Icon = ({ type, size = 20 }) => {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  switch (type) {
    case "upload":
      return (
        <svg {...common}>
          <path d="M12 16V4" />
          <path d="M7 9l5-5 5 5" />
          <path d="M4 20h16" />
        </svg>
      );
    case "ai":
      return (
        <svg {...common}>
          <path d="M12 3l1.4 4.1L17.5 9l-4.1 1.4L12 14.5l-1.4-4.1L6.5 9l4.1-1.9L12 3z" />
          <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z" />
        </svg>
      );
    case "alert":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5" />
          <path d="M12 16h.01" />
        </svg>
      );
    case "students":
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 00-3-3.87" />
          <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
      );
    case "academic":
      return (
        <svg {...common}>
          <path d="M3 10l9-5 9 5-9 5-9-5z" />
          <path d="M7 12.5V17c2.7 2 7.3 2 10 0v-4.5" />
          <path d="M21 10v6" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
          <path d="M8 14h2M14 14h2M8 17h2" />
        </svg>
      );
    case "reports":
      return (
        <svg {...common}>
          <path d="M6 3h9l3 3v15H6z" />
          <path d="M14 3v4h4" />
          <path d="M9 12h6M9 16h6" />
        </svg>
      );
    case "history":
      return (
        <svg {...common}>
          <path d="M3 12a9 9 0 109-9 9.3 9.3 0 00-6.4 2.6L3 8" />
          <path d="M3 3v5h5" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "trend":
      return (
        <svg {...common}>
          <path d="M3 7l6 6 4-4 8 8" />
          <path d="M16 17h5v-5" />
        </svg>
      );
    case "arrow":
      return (
        <svg {...common}>
          <path d="M5 12h13" />
          <path d="M13 6l6 6-6 6" />
        </svg>
      );
    case "file":
      return (
        <svg {...common}>
          <path d="M6 3h9l3 3v15H6z" />
          <path d="M14 3v4h4" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="M5 12l5 5L20 7" />
        </svg>
      );
    default:
      return null;
  }
};

/* ------------------------------------------------------------------
   Small helpers
------------------------------------------------------------------- */
const STAT_COLORS = {
  blue: "bg-indigo-50 text-indigo-500",
  red: "bg-red-50 text-red-400",
  orange: "bg-orange-50 text-orange-400",
  purple: "bg-purple-50 text-purple-500",
  green: "bg-emerald-50 text-emerald-500",
};

const STATUS_STYLES = {
  Completed: { badge: "bg-[#eaf8f2] text-[#1b9c72]", dot: "bg-[#1b9c72]" },
  Processing: { badge: "bg-amber-50 text-amber-600", dot: "bg-amber-500" },
  Failed: { badge: "bg-red-50 text-red-600", dot: "bg-red-500" },
  Pending: { badge: "bg-slate-100 text-slate-500", dot: "bg-slate-400" },
};

const RISK_KEYS = [
  "highRiskStudents",
  "studentsRequiringReview",
  "atRiskStudents",
  "studentsAtRisk",
  "riskStudents",
];

const countReviewStudents = (analysis) => {
  if (analysis.status !== "completed") return null;
  const result = analysis.result || {};
  const key = RISK_KEYS.find((name) => Array.isArray(result[name]));
  return key ? result[key].length : null;
};

const formatDate = (value, withYear = true) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        ...(withYear ? { year: "numeric" } : {}),
      })
    : "—";

const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded-md bg-[#eceff5] ${className}`} />
);

/* ------------------------------------------------------------------
   Page
------------------------------------------------------------------- */
const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!token) {
      setDashboardLoading(false);
      setDashboardError("Please log in again to view your dashboard.");
      return;
    }

    const controller = new AbortController();

    const loadDashboard = async () => {
      setDashboardLoading(true);
      setDashboardError("");

      try {
        const response = await fetch(
          "http://localhost:5000/api/analysis/dashboard",
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          },
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to load dashboard data.");
        }

        setDashboardData(data);
      } catch (error) {
        if (error.name !== "AbortError") {
          setDashboardError(error.message || "Unable to load dashboard data.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setDashboardLoading(false);
        }
      }
    };

    loadDashboard();

    return () => controller.abort();
  }, [token, reloadKey]);

  const managerName = user?.name || "Manager";
  const firstName = managerName.split(" ")[0];

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const currentDate = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(new Date()),
    [],
  );

  const go = (path, state) => navigate(path, state ? { state } : undefined);

  /* ---------------- Data ---------------- */
  const stats = dashboardData?.stats || {};
  const latestResult = dashboardData?.latestAnalysis?.result || null;

  const statistics = [
    {
      title: "Total students",
      value: stats.totalStudents?.toLocaleString("en-IN") ?? "0",
      description: "Across all uploaded datasets",
      icon: "students",
      color: "blue",
      to: "/manager/student-insights",
    },
    {
      title: "Need review",
      value: stats.highRiskStudents?.toLocaleString("en-IN") ?? "0",
      description: "From your latest analysis",
      icon: "alert",
      color: "red",
      to: "/manager/high-risk-students",
    },
    {
      title: "Completed analyses",
      value: stats.completedAnalyses?.toLocaleString("en-IN") ?? "0",
      description: "Saved AI results",
      icon: "trend",
      color: "orange",
      to: "/manager/analysis-history",
    },
    {
      title: "Average attendance",
      value:
        stats.averageAttendance == null ? "—" : `${stats.averageAttendance}%`,
      description: "From available attendance data",
      icon: "calendar",
      color: "purple",
      to: "/manager/attendance-analytics",
    },
    {
      title: "Average marks",
      value: stats.averageMarks == null ? "—" : stats.averageMarks,
      description: "From available marks",
      icon: "academic",
      color: "green",
      to: "/manager/academic-analytics",
    },
  ];

  const recentAnalyses = useMemo(
    () =>
      (dashboardData?.recentAnalyses || []).map((analysis) => {
        const status =
          analysis.status === "completed"
            ? "Completed"
            : analysis.status === "processing"
              ? "Processing"
              : analysis.status === "failed"
                ? "Failed"
                : "Pending";

        return {
          id: String(analysis._id),
          shortId: String(analysis._id).slice(-6),
          dataset:
            analysis.dataset?.name ||
            analysis.dataset?.originalFileName ||
            "Student dataset",
          createdAt: analysis.createdAt,
          date: formatDate(analysis.createdAt),
          shortDate: formatDate(analysis.createdAt, false),
          students: analysis.dataset?.totalRows ?? "—",
          indicators: countReviewStudents(analysis),
          status,
        };
      }),
    [dashboardData],
  );

  const attentionItems = latestResult
    ? [
        {
          title: "Latest AI analysis is ready",
          description:
            (typeof latestResult.executiveSummary === "string" &&
              latestResult.executiveSummary) ||
            (typeof latestResult.summary === "string" &&
              latestResult.summary) ||
            "A completed analysis is available. Open it to see the results.",
          action: "View report",
          icon: "reports",
        },
      ]
    : [];

  // Real chart data: how many students were flagged in each recent analysis
  const chartBars = useMemo(() => {
    const bars = recentAnalyses
      .filter((a) => typeof a.indicators === "number")
      .slice(0, 7)
      .reverse();
    const max = Math.max(...bars.map((b) => b.indicators), 1);
    return bars.map((b) => ({
      ...b,
      height: Math.max((b.indicators / max) * 100, 4),
    }));
  }, [recentAnalyses]);

  const hasData = recentAnalyses.length > 0;

  const PAGE_SIZE = 3;
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(recentAnalyses.length / PAGE_SIZE));

  const paginatedAnalyses = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return recentAnalyses.slice(start, start + PAGE_SIZE);
  }, [recentAnalyses, page]);

  // If the list gets shorter, do not stay on a page that no longer exists
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const rangeStart =
    recentAnalyses.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, recentAnalyses.length);

  /* ---------------- Render ---------------- */
  return (
    <div className="min-h-screen bg-[#f7f8fc] text-[#172b4d]">
      <main>
        <div className="mx-auto max-w-[1400px] px-5 py-7 lg:px-10">
          {/* Header */}
          <section className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="mb-1 text-[12px] font-medium text-[#6379dc]">
                {currentDate}
              </p>
              <h1 className="text-[28px] font-bold tracking-[-0.8px] text-[#172f52] sm:text-[32px]">
                {greeting}, {firstName}
              </h1>
              <p className="mt-1 text-[14px] text-[#6f8099]">
                Here is a quick look at your student analytics.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => go("/manager/reports")}
                className="flex items-center gap-2 rounded-lg border border-[#dfe4ed] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#344867] shadow-sm transition hover:bg-[#fafbfc] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5268d8]"
              >
                <Icon type="reports" size={17} />
                View reports
              </button>
              <button
                onClick={() => go("/manager/ai-analysis")}
                className="flex items-center gap-2 rounded-lg bg-[#5268d8] px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_5px_14px_rgba(82,104,216,0.25)] transition hover:bg-[#465bc5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5268d8] focus-visible:ring-offset-2"
              >
                <span className="text-lg leading-none">+</span>
                New analysis
              </button>
            </div>
          </section>

          {/* Error */}
          {dashboardError && (
            <div
              role="alert"
              className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-[14px] text-red-700"
            >
              <span>{dashboardError}</span>
              <button
                type="button"
                onClick={() => setReloadKey((k) => k + 1)}
                className="rounded-lg bg-white px-3 py-1.5 text-[13px] font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-50"
              >
                Try again
              </button>
            </div>
          )}

          {/* Stats */}
          <section
            aria-label="Summary"
            className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5"
          >
            {statistics.map((stat) => (
              <button
                key={stat.title}
                type="button"
                onClick={() => go(stat.to)}
                className="group rounded-xl border border-[#e4e8ef] bg-white p-5 text-left shadow-[0_2px_8px_rgba(32,45,72,0.03)] transition hover:border-[#c9d1f5] hover:shadow-[0_6px_18px_rgba(82,104,216,0.10)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5268d8]"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${STAT_COLORS[stat.color]}`}
                >
                  <Icon type={stat.icon} size={20} />
                </div>

                {dashboardLoading ? (
                  <Skeleton className="mt-4 h-8 w-20" />
                ) : (
                  <p className="mt-4 text-[28px] font-bold leading-none tracking-[-0.5px] text-[#172f52]">
                    {stat.value}
                  </p>
                )}

                <p className="mt-2 text-[13px] font-semibold text-[#243c5e]">
                  {stat.title}
                </p>
                <p className="mt-0.5 text-[12px] leading-4 text-[#8c9bb0]">
                  {stat.description}
                </p>
              </button>
            ))}
          </section>

          {/* Chart + Attention */}
          <section className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
            {/* Chart */}
            <div className="rounded-xl border border-[#e4e8ef] bg-white p-6 shadow-[0_2px_8px_rgba(32,45,72,0.03)]">
              <h2 className="text-[17px] font-semibold text-[#172f52]">
                Students flagged for review
              </h2>
              <p className="mt-1 text-[13px] text-[#8b9ab0]">
                Number of students flagged in each of your recent analyses
              </p>

              {dashboardLoading ? (
                <Skeleton className="mt-6 h-[220px] w-full" />
              ) : chartBars.length > 0 ? (
                <div className="mt-6 flex h-[220px] items-end gap-3 border-b border-[#e5e9f0] pb-2">
                  {chartBars.map((bar) => (
                    <div
                      key={bar.id}
                      className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                    >
                      <span className="text-[13px] font-semibold text-[#243c5e]">
                        {bar.indicators}
                      </span>
                      <div
                        className="w-full max-w-[56px] rounded-t-md bg-[#5268d8]/85 transition-all hover:bg-[#5268d8]"
                        style={{ height: `${bar.height}%` }}
                        title={`${bar.dataset} · ${bar.date}`}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 flex h-[220px] flex-col items-center justify-center rounded-lg bg-[#f7f8fc] text-center">
                  <p className="text-[14px] font-medium text-[#273d5e]">
                    No data to show yet
                  </p>
                  <p className="mt-1 max-w-xs text-[13px] text-[#8998ae]">
                    Run an AI analysis and this chart will fill in.
                  </p>
                </div>
              )}

              {chartBars.length > 0 && (
                <div className="mt-2 flex gap-3">
                  {chartBars.map((bar) => (
                    <span
                      key={bar.id}
                      className="flex-1 text-center text-[11px] text-[#9aa7ba]"
                    >
                      {bar.shortDate}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Attention */}
            <div className="rounded-xl border border-[#e4e8ef] bg-white p-6 shadow-[0_2px_8px_rgba(32,45,72,0.03)]">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-[17px] font-semibold text-[#172f52]">
                    Needs your attention
                  </h2>
                  <p className="mt-1 text-[13px] text-[#8b9ab0]">
                    Key points from your latest analysis
                  </p>
                </div>
                {attentionItems.length > 0 && (
                  <span className="rounded-lg bg-[#fff0ef] px-2.5 py-1 text-[12px] font-semibold text-[#e8736d]">
                    {attentionItems.length} new
                  </span>
                )}
              </div>

              <div className="mt-4">
                {dashboardLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-5/6" />
                  </div>
                ) : attentionItems.length > 0 ? (
                  attentionItems.map((item) => (
                    <div key={item.title} className="flex gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500">
                        <Icon type={item.icon} size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold text-[#273d5e]">
                          {item.title}
                        </p>
                        <p className="mt-1 line-clamp-4 text-[13px] leading-5 text-[#6f8099]">
                          {item.description}
                        </p>
                        <button
                          onClick={() =>
                            go(
                              dashboardData?.latestAnalysis?._id
                                ? `/manager/analysis-history/${dashboardData.latestAnalysis._id}`
                                : "/manager/analysis-history",
                            )
                          }
                          className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-[#5268d8] hover:underline"
                        >
                          {item.action}
                          <Icon type="arrow" size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg bg-[#f7f8fc] px-4 py-8 text-center">
                    <p className="text-[14px] font-medium text-[#273d5e]">
                      Nothing needs attention yet
                    </p>
                    <p className="mt-1 text-[13px] leading-5 text-[#8998ae]">
                      Upload student data and run an AI analysis to see insights
                      here.
                    </p>
                    <button
                      onClick={() => go("/manager/upload-data")}
                      className="mt-4 rounded-lg bg-[#5268d8] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#465bc5]"
                    >
                      Upload student data
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Recent analyses + Upload help */}
          <section className="mb-8 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(300px,0.8fr)] xl:items-start">
            {/* Recent analyses */}
            <div className="overflow-hidden rounded-xl border border-[#e4e8ef] bg-white shadow-[0_2px_8px_rgba(32,45,72,0.03)]">
              <div className="flex items-center justify-between gap-3 border-b border-[#edf0f4] px-6 py-5">
                <div>
                  <h2 className="text-[17px] font-semibold text-[#172f52]">
                    Recent analyses
                  </h2>
                  <p className="mt-1 text-[13px] text-[#8b9ab0]">
                    Your latest dataset reviews
                  </p>
                </div>
                <button
                  onClick={() => go("/manager/analysis-history")}
                  className="inline-flex items-center gap-1 whitespace-nowrap text-[13px] font-semibold text-[#5268d8] hover:underline"
                >
                  View all
                  <Icon type="arrow" size={14} />
                </button>
              </div>

              {dashboardLoading ? (
                <div className="space-y-4 p-6">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : !hasData ? (
                <div className="px-6 py-12 text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef0ff] text-[#5268d8]">
                    <Icon type="history" size={20} />
                  </div>
                  <p className="mt-4 text-[14px] font-medium text-[#273d5e]">
                    No analyses yet
                  </p>
                  <p className="mt-1 text-[13px] text-[#8998ae]">
                    Your finished analyses will show up here.
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px]">
                      <thead>
                        <tr className="border-b border-[#edf0f4] bg-[#fbfcfe] text-left text-[12px] font-semibold text-[#8493a9]">
                          <th className="px-6 py-3">Dataset</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Students</th>
                          <th className="px-4 py-3">Flagged</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-6 py-3 text-right">
                            <span className="sr-only">Action</span>
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {paginatedAnalyses.map((analysis) => {
                          const style =
                            STATUS_STYLES[analysis.status] ||
                            STATUS_STYLES.Pending;

                          return (
                            <tr
                              key={analysis.id}
                              className="border-b border-[#edf0f4] transition last:border-b-0 hover:bg-[#fbfcff]"
                            >
                              <td className="px-6 py-3.5">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eef0ff] text-[#5268d8]">
                                    <Icon type="file" size={17} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate text-[14px] font-semibold text-[#273d5e]">
                                      {analysis.dataset}
                                    </p>
                                    <p className="text-[12px] text-[#9aa7ba]">
                                      #{analysis.shortId}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="whitespace-nowrap px-4 py-3.5 text-[13px] text-[#6f8099]">
                                {analysis.date}
                              </td>

                              <td className="whitespace-nowrap px-4 py-3.5 text-[13px] text-[#6f8099]">
                                {analysis.students}
                              </td>

                              <td className="whitespace-nowrap px-4 py-3.5 text-[13px] text-[#6f8099]">
                                {analysis.indicators ?? "—"}
                              </td>

                              <td className="px-4 py-3.5">
                                <span
                                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-[12px] font-semibold ${style.badge}`}
                                >
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
                                  />
                                  {analysis.status}
                                </span>
                              </td>

                              <td className="whitespace-nowrap px-6 py-3.5 text-right">
                                {analysis.status === "Completed" ? (
                                  <button
                                    onClick={() =>
                                      go(
                                        `/manager/analysis-history/${analysis.id}`,
                                      )
                                    }
                                    className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#5268d8] hover:underline"
                                  >
                                    View report
                                    <Icon type="arrow" size={13} />
                                  </button>
                                ) : (
                                  <span className="text-[13px] text-[#b3bdcc]">
                                    —
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {recentAnalyses.length > PAGE_SIZE && (
                    <div className="flex flex-col items-center justify-between gap-3 border-t border-[#edf0f4] bg-[#fbfcfe] px-6 py-3.5 sm:flex-row">
                      <p className="text-[13px] text-[#8493a9]">
                        Showing{" "}
                        <span className="font-semibold text-[#273d5e]">
                          {rangeStart}–{rangeEnd}
                        </span>{" "}
                        of{" "}
                        <span className="font-semibold text-[#273d5e]">
                          {recentAnalyses.length}
                        </span>
                      </p>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="rounded-lg border border-[#e4e8ef] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#4d607c] transition hover:bg-[#f4f5ff] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
                        >
                          Previous
                        </button>

                        {Array.from(
                          { length: totalPages },
                          (_, i) => i + 1,
                        ).map((num) => (
                          <button
                            key={num}
                            onClick={() => setPage(num)}
                            aria-current={num === page ? "page" : undefined}
                            className={`h-8 w-8 rounded-lg text-[13px] font-semibold transition ${
                              num === page
                                ? "bg-[#5268d8] text-white shadow-[0_3px_8px_rgba(82,104,216,0.25)]"
                                : "border border-[#e4e8ef] bg-white text-[#4d607c] hover:bg-[#f4f5ff]"
                            }`}
                          >
                            {num}
                          </button>
                        ))}

                        <button
                          onClick={() =>
                            setPage((p) => Math.min(totalPages, p + 1))
                          }
                          disabled={page === totalPages}
                          className="rounded-lg border border-[#e4e8ef] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#4d607c] transition hover:bg-[#f4f5ff] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* How it works */}
            <div className="rounded-xl border border-[#dfe4f5] bg-[#f4f5ff] p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e7eaff] text-[#5268d8]">
                <Icon type="ai" size={20} />
              </div>

              <h2 className="mt-4 text-[17px] font-semibold text-[#253a5c]">
                Have new student data?
              </h2>
              <p className="mt-2 text-[13px] leading-5 text-[#6f8099]">
                Upload a file to see academic patterns, attendance signals, and
                students who may need support.
              </p>

              <ol className="mt-5 space-y-3">
                {[
                  "Upload your dataset",
                  "Check the data preview",
                  "Run the AI analysis",
                ].map((step, index) => (
                  <li key={step} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e4e7fb] text-[12px] font-semibold text-[#5268d8]">
                      {index + 1}
                    </span>
                    <span className="text-[13px] text-[#4d607c]">{step}</span>
                  </li>
                ))}
              </ol>

              <button
                onClick={() => go("/manager/upload-data")}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#5268d8] px-4 py-3 text-[13px] font-semibold text-white shadow-[0_5px_14px_rgba(82,104,216,0.22)] transition hover:bg-[#465bc5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5268d8] focus-visible:ring-offset-2"
              >
                Upload student data
                <Icon type="arrow" size={15} />
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default ManagerDashboard;
