import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Activity,
  CalendarClock,
  AlertTriangle,
  LogIn,
  Users,
  Database,
  Brain,
  Settings as SettingsIcon,
  Server,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminTopbar from "../../components/admin/AdminTopbar";
import { adminService } from "../../services/adminService";

const PAGE_SIZE = 10;

const CATEGORY_TABS = [
  { value: "all", label: "All events" },
  { value: "auth", label: "Authentication" },
  { value: "user", label: "Users" },
  { value: "data", label: "Data" },
  { value: "analysis", label: "Analysis" },
  { value: "settings", label: "Settings" },
  { value: "system", label: "System" },
];

const CATEGORY_ICONS = {
  auth: LogIn,
  user: Users,
  data: Database,
  analysis: Brain,
  settings: SettingsIcon,
  system: Server,
};

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
  { value: "processing", label: "Processing" },
];

const RANGE_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

function formatNumber(value) {
  return typeof value === "number"
    ? new Intl.NumberFormat("en-IN").format(value)
    : "—";
}

// Example: 30 Sep 2026, 10:21
function formatTimestamp(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";

  const date = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${date}, ${time}`;
}

function statusStyle(status = "") {
  const s = status.toLowerCase();
  if (["failed", "error"].includes(s))
    return { box: "bg-rose-50 text-rose-600", dot: "bg-rose-500", label: "Failed" };
  if (["processing", "pending"].includes(s))
    return { box: "bg-amber-50 text-amber-600", dot: "bg-amber-500", label: "Processing" };
  if (["success", "successful", "completed"].includes(s))
    return { box: "bg-emerald-50 text-emerald-600", dot: "bg-emerald-500", label: "Success" };
  return {
    box: "bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
    label: s ? s.charAt(0).toUpperCase() + s.slice(1) : "Unknown",
  };
}

// Example result: [1, "...", 4, 5, 6, "...", 20]
function getPageNumbers(page, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push("...");
  pages.push(totalPages);
  return pages;
}

function SummaryCard({ title, value, icon: Icon, color }) {
  return (
    <article className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon size={20} />
      </span>
      <div>
        <p className="text-2xl font-bold tracking-tight text-slate-900">
          {formatNumber(value)}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">{title}</p>
      </div>
    </article>
  );
}

export default function SystemLogs() {
  const [activeMenu, setActiveMenu] = useState("System Logs");
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [range, setRange] = useState("all");
  const [sort, setSort] = useState("newest");
  const [reloadKey, setReloadKey] = useState(0);

  const [state, setState] = useState({ data: null, loading: true, error: "" });
  const requestId = useRef(0);

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

  // Wait 400ms after typing before searching
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load data
  useEffect(() => {
    const current = ++requestId.current;
    setState((s) => ({ ...s, loading: true, error: "" }));

    adminService
      .getSystemLogs(
        { page, limit: PAGE_SIZE, search, status, category, range, sort },
        token
      )
      .then((data) => {
        if (current !== requestId.current) return; // old request, ignore
        setState({ data, loading: false, error: "" });
      })
      .catch((err) => {
        if (current !== requestId.current) return;
        console.error("System logs failed:", err);
        setState({
          data: null,
          loading: false,
          error: err.message || "Could not load system logs.",
        });
      });
  }, [token, page, search, status, category, range, sort, reloadKey]);

  const { data, loading, error } = state;
  const rows = data?.logs || [];
  const pagination = data?.pagination;
  const summary = data?.summary;

  const pageNumbers = useMemo(
    () => (pagination ? getPageNumbers(pagination.page, pagination.totalPages) : []),
    [pagination]
  );

  const from =
    pagination && pagination.total > 0
      ? (pagination.page - 1) * pagination.limit + 1
      : 0;
  const to = pagination
    ? Math.min(pagination.page * pagination.limit, pagination.total)
    : 0;

  const hasFilters =
    search || status !== "all" || category !== "all" || range !== "all";

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-800">
      <AdminSidebar
        activeMenu={activeMenu}
        onMenuClick={handleMenuClick}
        adminName={user?.name || "System Admin"}
        onLogout={logout}
      />

      <div className="min-h-screen lg:ml-[288px]">
        <AdminTopbar user={user} activeMenu={activeMenu} />

        <main className="space-y-6 p-5 md:p-8">
          {/* Title */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[2px] text-[#5268d8]">
              System operations
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              System activity logs
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              A record of key actions across the platform, including sign-ins,
              registrations and changes.
            </p>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Total events"
              value={summary?.total}
              icon={Activity}
              color="bg-indigo-50 text-indigo-600"
            />
            <SummaryCard
              title="Events today"
              value={summary?.today}
              icon={CalendarClock}
              color="bg-violet-50 text-violet-600"
            />
            <SummaryCard
              title="Logins today"
              value={summary?.loginsToday}
              icon={LogIn}
              color="bg-teal-50 text-teal-600"
            />
            <SummaryCard
              title="Failed today"
              value={summary?.failedToday}
              icon={AlertTriangle}
              color="bg-rose-50 text-rose-500"
            />
          </div>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Header + filters */}
            <div className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-800">Audit trail</h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Recent access and configuration events
                  </p>
                </div>
                <button
                  onClick={() => setReloadKey((k) => k + 1)}
                  title="Refresh"
                  className="rounded-lg border border-slate-200 bg-white p-2.5 text-slate-500 hover:bg-slate-50"
                >
                  <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                </button>
              </div>

              {/* Category tabs */}
              <div className="mt-5 flex flex-wrap gap-2">
                {CATEGORY_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => {
                      setCategory(tab.value);
                      setPage(1);
                    }}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                      category === tab.value
                        ? "bg-[#5268d8] text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <div className="relative w-full max-w-sm">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search by user, email, activity or resource..."
                    className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-3 text-xs outline-none placeholder:text-slate-400 focus:border-indigo-400"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <select
                    value={range}
                    onChange={(e) => {
                      setRange(e.target.value);
                      setPage(1);
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-400"
                  >
                    {RANGE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value);
                      setPage(1);
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-400"
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      setSort((s) => (s === "newest" ? "oldest" : "newest"));
                      setPage(1);
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <ArrowUpDown size={15} />
                    {sort === "newest" ? "Newest first" : "Oldest first"}
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            {error ? (
              <div className="border-t border-slate-100 p-10 text-center text-sm text-rose-500">
                {error}
              </div>
            ) : !loading && rows.length === 0 ? (
              <div className="border-t border-slate-100 p-10 text-center text-sm text-slate-400">
                {hasFilters
                  ? "No logs match your filters."
                  : "No system activity has been recorded yet."}
              </div>
            ) : (
              <div
                className={`overflow-x-auto transition-opacity ${
                  loading ? "opacity-50" : "opacity-100"
                }`}
              >
                <table className="w-full min-w-[900px] text-left text-xs">
                  <thead className="border-y border-slate-100 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Timestamp</th>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Activity</th>
                      <th className="px-6 py-4">Resource</th>
                      <th className="px-6 py-4">IP address</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading && rows.length === 0
                      ? Array.from({ length: 5 }, (_, i) => (
                          <tr key={i}>
                            <td colSpan={6} className="px-6 py-6">
                              <div className="h-4 animate-pulse rounded bg-slate-100" />
                            </td>
                          </tr>
                        ))
                      : rows.map((row) => {
                          const st = statusStyle(row.status);
                          const CatIcon = CATEGORY_ICONS[row.category] || Server;
                          return (
                            <tr key={row.id} className="hover:bg-slate-50/60">
                              <td className="whitespace-nowrap px-6 py-5 text-slate-600">
                                {formatTimestamp(row.timestamp)}
                              </td>
                              <td className="px-6 py-5">
                                <p className="font-semibold text-slate-700">
                                  {row.user}
                                </p>
                                {row.email && (
                                  <p className="mt-0.5 text-[11px] text-slate-400">
                                    {row.email}
                                  </p>
                                )}
                              </td>
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-2.5 text-slate-600">
                                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500">
                                    <CatIcon size={14} />
                                  </span>
                                  {row.activity}
                                </div>
                              </td>
                              <td className="px-6 py-5 text-slate-600">
                                {row.resource}
                              </td>
                              <td className="px-6 py-5 font-mono text-slate-500">
                                {row.ipAddress || "—"}
                              </td>
                              <td className="px-6 py-5">
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-semibold ${st.box}`}
                                >
                                  <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                                  {st.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.total > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
                <p className="text-xs text-slate-500">
                  Showing{" "}
                  <span className="font-semibold text-slate-700">
                    {from}–{to}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-700">
                    {formatNumber(pagination.total)}
                  </span>{" "}
                  events
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={pagination.page <= 1 || loading}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>

                  {pageNumbers.map((n, i) =>
                    n === "..." ? (
                      <span key={`dots-${i}`} className="px-1 text-xs text-slate-400">
                        …
                      </span>
                    ) : (
                      <button
                        key={n}
                        onClick={() => setPage(n)}
                        disabled={loading}
                        className={`h-8 min-w-8 rounded-lg px-2 text-xs font-semibold ${
                          n === pagination.page
                            ? "bg-[#5268d8] text-white"
                            : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {n}
                      </button>
                    )
                  )}

                  <button
                    onClick={() =>
                      setPage((p) => Math.min(pagination.totalPages, p + 1))
                    }
                    disabled={pagination.page >= pagination.totalPages || loading}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </section>

          <footer className="flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-5 text-[11px] text-slate-400">
            <span>© {new Date().getFullYear()} AI Student Analytics</span>
            <span>Insights support human judgment</span>
          </footer>
        </main>
      </div>
    </div>
  );
}