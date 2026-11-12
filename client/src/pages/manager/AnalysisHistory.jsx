import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  AlertCircle,
  ArrowRight,
  FileText,
  Filter,
  LoaderCircle,
  RefreshCw,
  Search,
} from "lucide-react";

const API_URL = "http://localhost:5000/api";
const PAGE_SIZE = 5; // reports shown per page

// 30 Sep 2026
const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function AnalysisHistory() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [items, setItems] = useState([]);
  const [totalAnalyses, setTotalAnalyses] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("newest");
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");

  // Wait a little after typing before searching.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchText.trim());
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText]);

  const loadHistory = useCallback(async () => {
    setRefreshing(true);
    setError("");

    try {
      const query = new URLSearchParams({
        page,
        limit: PAGE_SIZE,
        sort,
        search,
      });

      const response = await fetch(`${API_URL}/analysis-history?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not load the analysis history.");
      }

      setItems(data.items);
      setTotalAnalyses(data.totalAnalyses);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, page, sort, search]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const startIndex = (pagination.page - 1) * pagination.limit;

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <LoaderCircle className="mx-auto animate-spin text-indigo-600" size={34} />
          <p className="mt-4 text-sm text-slate-500">Loading analysis history...</p>
        </div>
      </main>
    );
  }

  if (error && items.length === 0 && totalAnalyses === 0) {
    return (
      <main className="min-h-[60vh] px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto text-red-500" size={38} />
          <h1 className="mt-4 text-xl font-semibold text-slate-900">Analysis history</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">{error}</p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={loadHistory}
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

  return (
    <main className="min-h-screen bg-[#fafafc] px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1600px]">
        {/* Heading */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-600">
            Workspace
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
            Analysis history
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            A record of previous analyses and their outcomes.
          </p>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Title and filters */}
          <div className="px-7 pb-6 pt-7">
            <h2 className="text-lg font-semibold text-slate-900">All analyses</h2>
            <p className="mt-1 text-sm text-slate-500">
              {totalAnalyses} completed {totalAnalyses === 1 ? "analysis" : "analyses"}
            </p>

            <div className="mt-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-[340px]">
                <Search
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search by dataset, ID, or creator..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-500"
                />
              </div>

              <div className="relative">
                <Filter
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
                />
                <select
                  value={sort}
                  onChange={(event) => {
                    setSort(event.target.value);
                    setPage(1);
                  }}
                  className="cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-5 text-sm font-semibold text-slate-800 outline-none hover:bg-slate-50 focus:border-indigo-500"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="mx-7 mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Table */}
          <div className={`overflow-x-auto ${refreshing ? "opacity-60" : ""}`}>
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead>
                <tr className="border-y border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-7 py-4">Analysis ID</th>
                  <th className="px-4 py-4">Dataset</th>
                  <th className="px-4 py-4">Date</th>
                  <th className="px-4 py-4">Students</th>
                  <th className="px-4 py-4">Review indicators</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Created by</th>
                  <th className="px-7 py-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.analysisId}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                  >
                    <td className="px-7 py-5 font-mono text-[13px] text-slate-600">
                      {item.displayId}
                    </td>

                    <td className="px-4 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
                          <FileText size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {item.datasetName}
                          </p>
                          {item.fileName && item.fileName !== item.datasetName && (
                            <p className="mt-0.5 truncate text-xs text-slate-400">
                              {item.fileName}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-5 text-sm text-slate-600">
                      {formatDate(item.date)}
                    </td>

                    <td className="px-4 py-5 text-sm text-slate-600">
                      {new Intl.NumberFormat("en-IN").format(item.students)}
                    </td>

                    <td className="px-4 py-5 text-sm text-slate-600">
                      {item.reviewCount ?? "—"}
                    </td>

                    <td className="px-4 py-5">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        Completed
                      </span>
                    </td>

                    <td className="px-4 py-5 text-sm text-slate-600">{item.createdBy}</td>

                    <td className="px-7 py-5 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/manager/analysis-history/${item.analysisId}`)
                        }
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        View report
                        <ArrowRight size={15} />
                      </button>
                    </td>
                  </tr>
                ))}

                {items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-7 py-14 text-center">
                      <p className="font-semibold text-slate-700">
                        {search ? "No analyses match your search" : "No analyses yet"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {search
                          ? "Try a different dataset name, ID or creator."
                          : "Upload a dataset and run AI analysis to see it here."}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.total > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-200 px-7 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing {startIndex + 1}–
                {Math.min(startIndex + pagination.limit, pagination.total)} of{" "}
                {pagination.total} analyses
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((value) => Math.max(value - 1, 1))}
                  disabled={pagination.page <= 1 || refreshing}
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
                  disabled={pagination.page >= pagination.totalPages || refreshing}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Footer */}
        <div className="mt-10 flex flex-col justify-between gap-2 border-t border-slate-200 pt-5 text-xs text-slate-400 sm:flex-row">
          <span>© 2026 AI Student Analytics</span>
          <span>Insights support human judgment</span>
        </div>
      </div>
    </main>
  );
}