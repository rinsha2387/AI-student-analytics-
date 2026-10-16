import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { adminService } from "../../services/adminService";
import AdminTopbar from "../../components/admin/AdminTopbar";

const initialSections = {
  stats: { data: null, loading: true, error: false },
  usage: { data: null, loading: true, error: false },
  health: { data: null, loading: true, error: false },
  activity: { data: null, loading: true, error: false },
};

function formatNumber(value) {
  return typeof value === "number"
    ? new Intl.NumberFormat("en-IN").format(value)
    : "—";
}

function EmptyState({ message = "No data available yet." }) {
  return (
    <div className="flex min-h-28 items-center justify-center text-center text-sm text-slate-400">
      {message}
    </div>
  );
}

function SectionStatus({ section }) {
  if (section.loading) {
    return <p className="text-xs text-slate-400">Loading...</p>;
  }

  if (section.error) {
    return <p className="text-xs text-rose-500">Could not load this section.</p>;
  }

  return null;
}

function StatCard({ title, value, subtitle, icon, color }) {
  return (
    <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
        <span className="text-lg">{icon}</span>
      </div>
      <p className="text-2xl font-bold tracking-tight text-slate-800">
        {value}
      </p>
      <h3 className="mt-1 text-sm font-semibold text-slate-700">{title}</h3>
      <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
    </article>
  );
}

function AIUsageChart({ section }) {
  const points = section.data;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-800">AI usage overview</h2>
          <p className="mt-1 text-xs text-slate-400">
            Analysis volume over the past six months
          </p>
        </div>
        <SectionStatus section={section} />
      </div>

      {section.loading ? (
        <EmptyState message="Loading usage data..." />
      ) : section.error ? (
        <EmptyState message="Usage data could not be loaded." />
      ) : !Array.isArray(points) || points.length === 0 ? (
        <EmptyState message="No AI usage data available yet." />
      ) : (
        <div className="w-full overflow-hidden">
          <svg
            viewBox="0 0 600 220"
            role="img"
            aria-label="AI analyses by month"
            className="h-auto w-full"
          >
            {Array.from({ length: 5 }, (_, i) => {
              const y = 185 - i * 40;
              return (
                <g key={i}>
                  <line
                    x1="45"
                    y1={y}
                    x2="585"
                    y2={y}
                    stroke="#e7eaf2"
                    strokeDasharray="4 4"
                  />
                </g>
              );
            })}

            {(() => {
              const values = points.map((p) => Number(p.count) || 0);
              const max = Math.max(...values, 1);
              const coords = values.map((value, i) => ({
                x: values.length === 1
                  ? 315
                  : 45 + (i * 540) / (values.length - 1),
                y: 185 - (value / max) * 160,
              }));
              const line = coords
                .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
                .join(" ");

              return (
                <>
                  <path
                    d={`${line} L ${coords[coords.length - 1].x} 185 L ${coords[0].x} 185 Z`}
                    fill="#5368dc"
                    opacity="0.08"
                  />
                  <path
                    d={line}
                    fill="none"
                    stroke="#5368dc"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  {coords.map((p, i) => (
                    <g key={`${points[i].month}-${i}`}>
                      <circle cx={p.x} cy={p.y} r="3" fill="#5368dc" />
                      <text
                        x={p.x}
                        y="207"
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="11"
                      >
                        {points[i].month}
                      </text>
                    </g>
                  ))}
                </>
              );
            })()}
          </svg>
        </div>
      )}
    </section>
  );
}

function SystemHealth({ section }) {
  const health = section.data;

  const items = health
    ? [
        {
          label: "Success rate",
          value:
            typeof health.successRate === "number"
              ? `${health.successRate}%`
              : null,
          percent: health.successRate,
        },
        {
          label: "Average processing time",
          value:
            typeof health.averageProcessingSeconds === "number"
              ? `${health.averageProcessingSeconds} sec`
              : null,
          percent: null,
        },
        {
          label: "Datasets processed this month",
          value:
            typeof health.datasetsThisMonth === "number"
              ? formatNumber(health.datasetsThisMonth)
              : null,
          percent: null,
        },
      ]
    : [];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <h2 className="font-semibold text-slate-800">System health</h2>
          <p className="mt-1 text-xs text-slate-400">
            Processing performance at a glance
          </p>
        </div>
        <span className="text-xl text-slate-400">⌁</span>
      </div>

      {section.loading ? (
        <EmptyState message="Loading system health..." />
      ) : section.error ? (
        <EmptyState message="System health could not be loaded." />
      ) : !health || !items.some((item) => item.value !== null) ? (
        <EmptyState message="No system health data available yet." />
      ) : (
        <div className="mt-6 space-y-6">
          {items.map((item) => (
            <div key={item.label}>
              <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                <span className="text-slate-500">{item.label}</span>
                <span className="font-semibold text-slate-700">
                  {item.value ?? "—"}
                </span>
              </div>

              {typeof item.percent === "number" && (
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{
                      width: `${Math.max(0, Math.min(100, item.percent))}%`,
                    }}
                  />
                </div>
              )}
            </div>
          ))}

          <Link
            to="/admin/processing-monitor"
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Open processing monitor <span>→</span>
          </Link>
        </div>
      )}
    </section>
  );
}

function RecentActivity({ section }) {
  const activities = section.data;

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-6">
        <div>
          <h2 className="font-semibold text-slate-800">Recent system activity</h2>
          <p className="mt-1 text-xs text-slate-400">
            Latest actions across your workspace
          </p>
        </div>
        <Link
          to="/admin/system-logs"
          className="text-xs font-semibold text-indigo-600 hover:underline"
        >
          View all logs →
        </Link>
      </div>

      {section.loading ? (
        <EmptyState message="Loading recent activity..." />
      ) : section.error ? (
        <EmptyState message="Recent activity could not be loaded." />
      ) : !Array.isArray(activities) || activities.length === 0 ? (
        <EmptyState message="No recent system activity." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Activity</th>
                <th className="px-6 py-4">Dataset</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activities.map((item, index) => (
                <tr key={item._id || item.id || index}>
                  <td className="px-6 py-5 text-slate-600">
                    {item.userName || "Unknown user"}
                  </td>
                  <td className="px-6 py-5 text-slate-600">
                    {item.activity || "—"}
                  </td>
                  <td className="px-6 py-5 text-slate-600">
                    {item.datasetName || "—"}
                  </td>
                  <td className="px-6 py-5 text-slate-500">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-6 py-5">
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600">
                      {item.status || "Unknown"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function Dashboard() {
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const { user, token } = useAuth();
  const [sections, setSections] = useState(initialSections);

  const loadDashboard = useCallback(async () => {
    const requests = [
      ["stats", adminService.getStats],
      ["usage", adminService.getUsage],
      ["health", adminService.getHealth],
      ["activity", adminService.getActivity],
    ];

    // Each section updates independently.
    await Promise.all(
      requests.map(async ([key, request]) => {
        try {
          const data = await request(token);
          setSections((current) => ({
            ...current,
            [key]: { data, loading: false, error: false },
          }));
        } catch (error) {
          console.error(`Admin dashboard ${key} request failed:`, error);
          setSections((current) => ({
            ...current,
            [key]: { data: null, loading: false, error: true },
          }));
        }
      })
    );
  }, [token]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const stats = sections.stats.data;

  const statCards = [
    {
      key: "managementUsers",
      title: "Management users",
      value: stats?.managementUsers,
      subtitle:
        typeof stats?.activeUsersThisMonth === "number"
          ? `${formatNumber(stats.activeUsersThisMonth)} active this month`
          : "Active-user data unavailable",
      icon: "♙",
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      key: "totalStudents",
      title: "Total students",
      value: stats?.totalStudents,
      subtitle: "Across all datasets",
      icon: "♧",
      color: "bg-violet-50 text-violet-600",
    },
    {
      key: "uploadedDatasets",
      title: "Uploaded datasets",
      value: stats?.uploadedDatasets,
      subtitle:
        typeof stats?.datasetsThisMonth === "number"
          ? `${formatNumber(stats.datasetsThisMonth)} this month`
          : "Monthly data unavailable",
      icon: "▤",
      color: "bg-orange-50 text-orange-500",
    },
    {
      key: "aiAnalyses",
      title: "AI analyses",
      value: stats?.aiAnalyses,
      subtitle: "Across the institution",
      icon: "✳",
      color: "bg-teal-50 text-teal-600",
    },
    {
      key: "completedAnalyses",
      title: "Completed analyses",
      value: stats?.completedAnalyses,
      subtitle:
        typeof stats?.failedAnalyses === "number"
          ? `${formatNumber(stats.failedAnalyses)} failed analyses`
          : "Failure data unavailable",
      icon: "✓",
      color: "bg-indigo-50 text-indigo-600",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-800">
      <AdminSidebar />

      <div className="min-h-screen md:ml-[260px]">
       <AdminTopbar
         user={user}
         activeMenu={activeMenu}
       />
       
        <main className="space-y-6 p-5 md:p-8">
          {/* Page title */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#5268d8] ">
                {new Date().toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                System overview
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Monitor your institution's analytics activity and system health.
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                to="/admin/reports"
                className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs font-semibold hover:bg-slate-50"
              >
                View reports
              </Link>
              <button
                onClick={loadDashboard}
                className="rounded-lg bg-[#5268d8] px-4 py-3 text-xs font-semibold text-white shadow-sm hover:bg-[#4358c6]"
              >
                ↻ Refresh data
              </button>
            </div>
          </div>

          {/* Stats */}
          {sections.stats.loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-400">
              Loading overview data...
            </div>
          ) : sections.stats.error ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-rose-500">
              Could not load overview statistics. Other sections may still be available.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {statCards.map((card) => (
                <StatCard
                  key={card.key}
                  title={card.title}
                  value={
                    typeof card.value === "number"
                      ? formatNumber(card.value)
                      : "—"
                  }
                  subtitle={
                    typeof card.value === "number"
                      ? card.subtitle
                      : "No data available"
                  }
                  icon={card.icon}
                  color={card.color}
                />
              ))}
            </div>
          )}

          {/* Usage and health */}
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.7fr_1fr]">
            <AIUsageChart section={sections.usage} />
            <SystemHealth section={sections.health} />
          </div>

          {/* Recent activity */}
          <RecentActivity section={sections.activity} />

          <footer className="flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-5 text-[11px] text-slate-400">
            <span>© {new Date().getFullYear()} AI Student Analytics</span>
            <span>Insights support human judgment</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
