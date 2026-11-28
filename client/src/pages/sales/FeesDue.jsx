import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Download, LoaderCircle, Search } from "lucide-react";
import {
  AVATAR_COLORS,
  PageError,
  PageLoading,
  StatusBadge,
  downloadCSV,
  fetchSales,
  formatDate,
  formatFull,
  getInitials,
} from "./SalesShared";

const PAGE_SIZE = 10;

export default function FeesDue() {
  const { token } = useAuth();

  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({ all: 0, Overdue: 0, Pending: 0, Partial: 0 });
  const [totalDue, setTotalDue] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [datasetName, setDatasetName] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("amount");
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

  const load = useCallback(async () => {
    setRefreshing(true);
    setError("");

    try {
      const data = await fetchSales(token, "fees-due", {
        page,
        limit: PAGE_SIZE,
        search,
        status,
        sort,
      });

      setItems(data.items);
      setCounts(data.counts);
      setTotalDue(data.totalDue);
      setPagination(data.pagination);
      setDatasetName(data.source.name);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, page, search, status, sort]);

  useEffect(() => {
    load();
  }, [load]);

  const exportCSV = async () => {
    setExporting(true);

    try {
      const data = await fetchSales(token, "export", { type: "due" });

      downloadCSV(
        `fees-due-${data.datasetName}.csv`,
        ["Student ID", "Student Name", "Department", "Amount Due", "Amount Paid", "Due Date", "Status", "Days Overdue"],
        data.rows.map((row) => [
          row.id,
          row.name,
          row.department,
          row.due ?? "",
          row.paid ?? "",
          row.dueDate ? formatDate(row.dueDate) : "",
          row.status,
          row.daysOverdue || "",
        ]),
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <PageLoading text="Loading fees due..." />;
  if (error && items.length === 0 && counts.all === 0) {
    return <PageError title="Fees due" message={error} onRetry={load} />;
  }

  const startIndex = (pagination.page - 1) * pagination.limit;

  const chips = [
    { value: "all", label: "All", count: counts.all },
    { value: "Overdue", label: "Overdue", count: counts.Overdue },
    { value: "Pending", label: "Pending", count: counts.Pending },
    { value: "Partial", label: "Partial", count: counts.Partial },
  ];

  return (
    <main className="min-h-screen bg-[#fafafc] px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-600">Fees</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">Fees due</h1>
            <p className="mt-3 text-sm text-slate-500">
              Students with an outstanding balance, from {datasetName}.
            </p>
          </div>

          <button
            type="button"
            onClick={exportCSV}
            disabled={exporting}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          >
            {exporting ? <LoaderCircle size={17} className="animate-spin" /> : <Download size={17} />}
            Export data
          </button>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 px-7 py-6 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Outstanding balances</h2>
              <p className="mt-1 text-sm text-slate-500">
                {pagination.total} students · {formatFull(totalDue)} in this view
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex rounded-lg bg-slate-100 p-1">
                {chips.map((chip) => (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => {
                      setStatus(chip.value);
                      setPage(1);
                    }}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                      status === chip.value
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {chip.label} ({chip.count})
                  </button>
                ))}
              </div>

              <select
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500"
              >
                <option value="amount">Highest amount first</option>
                <option value="dueDate">Earliest due date first</option>
              </select>

              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search students..."
                  className="w-52 rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="mx-7 mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className={`overflow-x-auto ${refreshing ? "opacity-60" : ""}`}>
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-y border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-7 py-4">Student</th>
                  <th className="px-4 py-4">Amount due</th>
                  <th className="px-4 py-4">Paid so far</th>
                  <th className="px-4 py-4">Due date</th>
                  <th className="px-4 py-4">Overdue by</th>
                  <th className="px-7 py-4">Status</th>
                </tr>
              </thead>

              <tbody>
                {items.map((student, index) => (
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

                    <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                      {formatFull(student.due)}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">{formatFull(student.paid)}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">{formatDate(student.dueDate)}</td>
                    <td className="px-4 py-4 text-sm">
                      {student.daysOverdue > 0 ? (
                        <span className="font-semibold text-red-500">{student.daysOverdue} days</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-7 py-4">
                      <StatusBadge status={student.status} />
                    </td>
                  </tr>
                ))}

                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-7 py-14 text-center">
                      <p className="font-semibold text-slate-700">No fees due to show</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Try a different search or status filter.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {pagination.total > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-200 px-7 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing {startIndex + 1}–{Math.min(startIndex + pagination.limit, pagination.total)} of{" "}
                {pagination.total} students
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
                  onClick={() => setPage((value) => Math.min(value + 1, pagination.totalPages))}
                  disabled={pagination.page >= pagination.totalPages || refreshing}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>

        <div className="mt-10 flex flex-col justify-between gap-2 border-t border-slate-200 pt-5 text-xs text-slate-400 sm:flex-row">
          <span>© 2026 AI Student Analytics</span>
          <span>Verify amounts with authorized records</span>
        </div>
      </div>
    </main>
  );
}