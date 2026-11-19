import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ArrowUpDown,
  FileText,
  Building2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminTopbar from "../../components/admin/AdminTopbar";
import { adminService } from "../../services/adminService";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "completed", label: "Completed" },
  { value: "processing", label: "Processing" },
  { value: "failed", label: "Failed" },
];

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatNumber(value) {
  return typeof value === "number"
    ? new Intl.NumberFormat("en-IN").format(value)
    : "—";
}

function statusStyle(status = "") {
  const s = status.toLowerCase();
  if (["completed", "success", "successful"].includes(s))
    return { box: "bg-emerald-50 text-emerald-600", dot: "bg-emerald-500", label: "Completed" };
  if (["failed", "error"].includes(s))
    return { box: "bg-rose-50 text-rose-600", dot: "bg-rose-500", label: "Failed" };
  if (["processing", "pending", "running", "queued", "in_progress"].includes(s))
    return { box: "bg-amber-50 text-amber-600", dot: "bg-amber-500", label: "Processing" };
  return { box: "bg-slate-100 text-slate-600", dot: "bg-slate-400", label: "Unknown" };
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

export default function AnalysisHistory() {
  const [activeMenu, setActiveMenu] = useState("Analysis History");
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");

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
      .getAnalysisHistory(
        { page, limit: PAGE_SIZE, search, status, sort },
        token
      )
      .then((data) => {
        if (current !== requestId.current) return; // old request, ignore
        setState({ data, loading: false, error: "" });
      })
      .catch((err) => {
        if (current !== requestId.current) return;
        console.error("Analysis history failed:", err);
        setState({
          data: null,
          loading: false,
          error: err.message || "Could not load analysis history.",
        });
      });
  }, [token, page, search, status, sort]);

  const { data, loading, error } = state;
  const rows = data?.analyses || [];
  const pagination = data?.pagination;
  const summary = data?.summary;

  const pageNumbers = useMemo(
    () => (pagination ? getPageNumbers(pagination.page, pagination.totalPages) : []),
    [pagination]
  );

  const from = pagination && pagination.total > 0
    ? (pagination.page - 1) * pagination.limit + 1
    : 0;
  const to = pagination
    ? Math.min(pagination.page * pagination.limit, pagination.total)
    : 0;

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
              Workspace
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Analysis history
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              A record of previous analyses across all institutions.
            </p>
          </div>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Header + filters */}
            <div className="p-6">
              <h2 className="font-semibold text-slate-800">All analyses</h2>
              <p className="mt-1 text-xs text-slate-400">
                {summary
                  ? `${formatNumber(summary.total)} total · ${formatNumber(
                      summary.completed
                    )} completed · ${formatNumber(summary.failed)} failed`
                  : "Loading..."}
              </p>

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
                    placeholder="Search by dataset, ID, creator or institution..."
                    className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-3 text-xs outline-none placeholder:text-slate-400 focus:border-indigo-400"
                  />
                </div>

                <div className="flex gap-3">
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
                {search || status !== "all"
                  ? "No analyses match your filters."
                  : "No analyses have been run yet."}
              </div>
            ) : (
              <div
                className={`overflow-x-auto transition-opacity ${
                  loading ? "opacity-50" : "opacity-100"
                }`}
              >
                <table className="w-full min-w-[980px] text-left text-xs">
                  <thead className="border-y border-slate-100 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Analysis ID</th>
                      <th className="px-6 py-4">Dataset</th>
                      <th className="px-6 py-4">Institution</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Students</th>
                      <th className="px-6 py-4">Review indicators</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Created by</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading && rows.length === 0
                      ? Array.from({ length: 5 }, (_, i) => (
                          <tr key={i}>
                            <td colSpan={8} className="px-6 py-6">
                              <div className="h-4 animate-pulse rounded bg-slate-100" />
                            </td>
                          </tr>
                        ))
                      : rows.map((row) => {
                          const st = statusStyle(row.status);
                          return (
                            <tr key={row.id} className="hover:bg-slate-50/60">
                              <td className="px-6 py-5 font-mono text-slate-600">
                                {row.analysisId}
                              </td>
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-3">
                                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                    <FileText size={17} />
                                  </span>
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-800">
                                      {row.datasetName}
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-slate-400">
                                      {row.analysisId}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-2 text-slate-700">
                                  <Building2 size={15} className="shrink-0 text-slate-400" />
                                  <span>{row.institutionName}</span>
                                </div>
                              </td>
                              <td className="px-6 py-5 text-slate-600">
                                {formatDate(row.createdAt)}
                              </td>
                              <td className="px-6 py-5 text-slate-600">
                                {formatNumber(row.students)}
                              </td>
                              <td className="px-6 py-5 text-slate-600">
                                {formatNumber(row.reviewIndicators)}
                              </td>
                              <td className="px-6 py-5">
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-semibold ${st.box}`}
                                >
                                  <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                                  {st.label}
                                </span>
                              </td>
                              <td className="px-6 py-5 text-slate-600">
                                {row.creatorName}
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
                  analyses
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