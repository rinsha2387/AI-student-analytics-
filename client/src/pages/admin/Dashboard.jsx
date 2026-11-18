import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  GraduationCap,
  FileText,
  Brain,
  CheckCircle2,
  Activity,
  FileBarChart,
  Plus,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminTopbar from "../../components/admin/AdminTopbar";
import { adminService } from "../../services/adminService";

function formatNumber(value) {
  return typeof value === "number"
    ? new Intl.NumberFormat("en-IN").format(value)
    : "—";
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function EmptyState({ message = "No data available yet." }) {
  return (
    <div className="flex min-h-28 items-center justify-center text-center text-sm text-slate-400">
      {message}
    </div>
  );
}

/* ---------- Stat card ---------- */
function StatCard({ title, value, subtitle, icon: Icon, color }) {
  return (
    <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl ${color}`}
      >
        <Icon size={20} />
      </div>
      <p className="text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
      <h3 className="mt-1 text-sm font-semibold text-slate-700">{title}</h3>
      <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
    </article>
  );
}

/* ---------- AI usage chart ---------- */
function AIUsageChart({ points, loading, error, operational }) {
  const [hover, setHover] = useState(null);

  let body;

  if (loading) {
    body = <EmptyState message="Loading usage data..." />;
  } else if (error) {
    body = <EmptyState message="Usage data could not be loaded." />;
  } else if (!Array.isArray(points) || points.length === 0) {
    body = <EmptyState message="No AI usage data available yet." />;
  } else {
    const values = points.map((p) => Number(p.count) || 0);
    const rawMax = Math.max(...values, 1);

    // Nice y-axis: 4 equal steps
    let step = Math.ceil(rawMax / 4);
    if (step > 5) step = Math.ceil(step / 5) * 5;
    const max = step * 4;

    const left = 45;
    const right = 585;
    const bottom = 185;
    const height = 160;

    const coords = values.map((value, i) => ({
      x:
        values.length === 1
          ? (left + right) / 2
          : left + (i * (right - left)) / (values.length - 1),
      y: bottom - (value / max) * height,
      value,
    }));

    // Smooth curve
    const line = coords.reduce((path, p, i, arr) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = arr[i - 1];
      const cx = (prev.x + p.x) / 2;
      return `${path} C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
    }, "");

    const area = `${line} L ${coords[coords.length - 1].x} ${bottom} L ${coords[0].x} ${bottom} Z`;

    body = (
      <div className="w-full overflow-hidden">
        <svg
          viewBox="0 0 600 220"
          role="img"
          aria-label="AI analyses by month"
          className="h-auto w-full"
          onMouseLeave={() => setHover(null)}
        >
          {Array.from({ length: 5 }, (_, i) => {
            const y = bottom - i * 40;
            return (
              <g key={i}>
                <line
                  x1={left}
                  y1={y}
                  x2={right}
                  y2={y}
                  stroke="#e7eaf2"
                  strokeDasharray="4 4"
                />
                <text
                  x={left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="11"
                >
                  {step * i}
                </text>
              </g>
            );
          })}

          <path d={area} fill="#5368dc" opacity="0.08" />
          <path
            d={line}
            fill="none"
            stroke="#5368dc"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {coords.map((p, i) => (
            <g key={`${points[i].month}-${i}`}>
              <text
                x={p.x}
                y="207"
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="11"
              >
                {points[i].month}
              </text>
              {/* Big invisible circle makes hover easy */}
              <circle
                cx={p.x}
                cy={p.y}
                r="14"
                fill="transparent"
                onMouseEnter={() => setHover(i)}
              />
              {hover === i && (
                <circle cx={p.x} cy={p.y} r="4.5" fill="#5368dc" />
              )}
            </g>
          ))}

          {hover !== null && (
            <g
              transform={`translate(${Math.min(
                Math.max(coords[hover].x - 40, 5),
                515
              )}, ${Math.max(coords[hover].y - 58, 4)})`}
            >
              <rect
                width="80"
                height="44"
                rx="8"
                fill="white"
                stroke="#e2e8f0"
              />
              <text x="10" y="17" fontSize="11" fontWeight="700" fill="#1e293b">
                {points[hover].month}
              </text>
              <text x="10" y="34" fontSize="11" fill="#64748b">
                Analyses: <tspan fontWeight="700" fill="#1e293b">{coords[hover].value}</tspan>
              </text>
            </g>
          )}
        </svg>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-800">AI usage overview</h2>
          <p className="mt-1 text-xs text-slate-400">
            Analysis volume over the past six months
          </p>
        </div>

        {!loading && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold ${
              error || operational === false
                ? "bg-rose-50 text-rose-600"
                : "bg-emerald-50 text-emerald-600"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                error || operational === false ? "bg-rose-500" : "bg-emerald-500"
              }`}
            />
            {error || operational === false
              ? "System issue"
              : "System operational"}
          </span>
        )}
      </div>

      {body}
    </section>
  );
}

/* ---------- System health ---------- */
function SystemHealth({ health, loading, error }) {
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
          // Bar: 60 seconds = full bar (only for display)
          percent:
            typeof health.averageProcessingSeconds === "number"
              ? Math.min(100, (health.averageProcessingSeconds / 60) * 100)
              : null,
        },
        {
          label: "Datasets processed this month",
          value:
            typeof health.datasetsThisMonth === "number"
              ? formatNumber(health.datasetsThisMonth)
              : null,
          percent:
            typeof health.datasetsThisMonth === "number"
              ? Math.min(100, (health.datasetsThisMonth / 20) * 100)
              : null,
        },
      ]
    : [];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <h2 className="font-semibold text-slate-800">System health</h2>
          <p className="mt-1 text-xs text-slate-400">
            Processing performance at a glance
          </p>
        </div>
        <Activity size={20} className="text-slate-400" />
      </div>

      {loading ? (
        <EmptyState message="Loading system health..." />
      ) : error ? (
        <EmptyState message="System health could not be loaded." />
      ) : !health ? (
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
            Open processing monitor <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </section>
  );
}

/* ---------- Recent activity ---------- */
function statusStyle(status = "") {
  const s = status.toLowerCase();
  if (["completed", "success", "successful"].includes(s))
    return { box: "bg-emerald-50 text-emerald-600", dot: "bg-emerald-500" };
  if (["failed", "error"].includes(s))
    return { box: "bg-rose-50 text-rose-600", dot: "bg-rose-500" };
  return { box: "bg-slate-100 text-slate-600", dot: "bg-slate-400" };
}

function RecentActivity({ activities, loading, error }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 p-6">
        <div>
          <h2 className="font-semibold text-slate-800">
            Recent system activity
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Latest actions across your workspace
          </p>
        </div>
        <Link
          to="/admin/system-logs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:underline"
        >
          View all logs <ArrowRight size={14} />
        </Link>
      </div>

      {loading ? (
        <EmptyState message="Loading recent activity..." />
      ) : error ? (
        <EmptyState message="Recent activity could not be loaded." />
      ) : !Array.isArray(activities) || activities.length === 0 ? (
        <EmptyState message="No recent system activity." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-xs">
            <thead className="border-y border-slate-100 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Activity</th>
                <th className="px-6 py-4">Dataset</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activities.map((item, index) => {
                const style = statusStyle(item.status);
                return (
                  <tr key={item.id || index}>
                    <td className="px-6 py-5 text-slate-600">
                      {item.user || "Unknown user"}
                    </td>
                    <td className="px-6 py-5 text-slate-600">
                      {item.activity || "—"}
                    </td>
                    <td className="px-6 py-5 text-slate-600">
                      {item.dataset || "—"}
                    </td>
                    <td className="px-6 py-5 text-slate-500">
                      {formatDate(item.date)}
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-semibold ${style.box}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                        {item.status || "Unknown"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* ---------- Page ---------- */
export default function Dashboard() {
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [state, setState] = useState({
    data: null,
    loading: true,
    error: false,
  });

  const handleMenuClick = (item) => {
    const routes = {
      Dashboard: "/admin/dashboard",
      "Management Users": "/admin/management-users",
      "Student Data": "/admin/student-data",
      "AI Prompts": "/admin/ai-prompts",
      "AI Configuration": "/admin/ai-config",
      "Analysis Configuration": "/admin/analysis-configuration",
      "Processing Monitor": "/admin/processing-monitor",
      Reports: "/admin/reports",
      "Analysis History": "/admin/analysis-history",
      "System Logs": "/admin/system-logs",
      Settings: "/admin/settings",
    };

    const path = routes[item.name];
    if (path) {
      setActiveMenu(item.name);
      navigate(path);
    }
  };

  const loadDashboard = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: false }));
    try {
      const data = await adminService.getDashboard(token);
      setState({ data, loading: false, error: false });
    } catch (error) {
      console.error("Admin dashboard request failed:", error);
      setState({ data: null, loading: false, error: true });
    }
  }, [token]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const { data, loading, error } = state;
  const stats = data?.stats;

  // health needs datasetsThisMonth, which the backend keeps inside stats
  const health = data?.health
    ? { ...data.health, datasetsThisMonth: stats?.datasetsThisMonth }
    : null;

  const statCards = [
    {
      key: "managementUsers",
      title: "Management users",
      value: stats?.managementUsers,
      subtitle:
        typeof stats?.activeManagementUsers === "number"
          ? `${formatNumber(stats.activeManagementUsers)} active`
          : "Active-user data unavailable",
      icon: Users,
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      key: "totalStudents",
      title: "Total students",
      value: stats?.totalStudents,
      subtitle: "Across all datasets",
      icon: GraduationCap,
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
      icon: FileText,
      color: "bg-orange-50 text-orange-500",
    },
    {
      key: "aiAnalyses",
      title: "AI analyses",
      value: stats?.aiAnalyses,
      subtitle: "Across the institution",
      icon: Brain,
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
      icon: CheckCircle2,
      color: "bg-indigo-50 text-indigo-600",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-800">
      <AdminSidebar
        activeMenu={activeMenu}
        onMenuClick={handleMenuClick}
        adminName={user?.name || "System Admin"}
        onLogout={logout}
      />

      <div className="min-h-screen md:ml-[260px]">
        <AdminTopbar user={user} activeMenu={activeMenu} />

        <main className="space-y-6 p-5 md:p-8">
          {/* Page title */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[2px] text-[#5268d8]">
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
              <button
                onClick={loadDashboard}
                title="Refresh data"
                className="rounded-lg border border-slate-200 bg-white px-3 text-slate-500 hover:bg-slate-50"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              </button>
              <Link
                to="/admin/reports"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs font-semibold hover:bg-slate-50"
              >
                <FileBarChart size={16} /> View reports
              </Link>
              <Link
                to="/admin/system-logs"
                className="inline-flex items-center gap-2 rounded-lg bg-[#5268d8] px-4 py-3 text-xs font-semibold text-white shadow-sm hover:bg-[#4358c6]"
              >
                <Plus size={16} /> View activity
              </Link>
            </div>
          </div>

          {/* Stats */}
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-400">
              Loading overview data...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-rose-500">
              Could not load dashboard data. Please try again.
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
            <AIUsageChart
              points={data?.usage}
              loading={loading}
              error={error}
              operational={data?.health?.operational}
            />
            <SystemHealth health={health} loading={loading} error={error} />
          </div>

          {/* Recent activity */}
          <RecentActivity
            activities={data?.activity}
            loading={loading}
            error={error}
          />

          <footer className="flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-5 text-[11px] text-slate-400">
            <span>© {new Date().getFullYear()} AI Student Analytics</span>
            <span>Insights support human judgment</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
