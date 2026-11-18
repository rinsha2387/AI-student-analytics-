import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
// Change this path if you save InsightParts.jsx somewhere else.
import { BarChart, StatCard, formatNumber } from "../../components/manager/InsightParts";
import { ArrowRight, Banknote, CheckCircle2, Percent, Users } from "lucide-react";
import {
  AVATAR_COLORS,
  NoFeeData,
  PageError,
  PageLoading,
  StatusBadge,
  fetchSales,
  formatDate,
  formatFull,
  formatShort,
  getInitials,
} from "./salesShared";

export default function SalesDashboard() {
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setData(await fetchSales(token, "summary"));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <PageLoading text="Loading the sales dashboard..." />;
  if (error || !data) {
    return <PageError title="Sales dashboard" message={error || "No data."} onRetry={load} />;
  }

  const { summary, source } = data;

  if (!summary.available) return <NoFeeData title="Sales dashboard" fileName={source.fileName} />;

  return (
    <main className="min-h-screen bg-[#fafafc] px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-600">
            Sales overview
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
            Sales dashboard
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            Fee collection at a glance for {user?.institution?.name || "your institution"}.
          </p>
        </div>

        <section className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Banknote}
            tone="red"
            value={formatShort(summary.totalDue)}
            label="Fees outstanding"
            description="Still to be collected"
          />
          <StatCard
            icon={CheckCircle2}
            tone="teal"
            value={formatShort(summary.totalPaid)}
            label="Fees collected"
            description="Payments received"
          />
          <StatCard
            icon={Percent}
            tone="indigo"
            value={summary.collectionRate === null ? "N/A" : `${summary.collectionRate}%`}
            label="Collection rate"
            description="Of total fees billed"
          />
          <StatCard
            icon={Users}
            tone="orange"
            value={formatNumber(summary.studentsWithDues)}
            label="Students with dues"
            description={
              summary.overdueCount > 0
                ? `${summary.overdueCount} past their due date`
                : "Students with a balance"
            }
          />
        </section>

        <section className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
          <BarChart
            title="Fee status"
            subtitle="Number of students by payment status"
            data={summary.statusChart}
            palette="teal"
          />

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                  Largest outstanding balances
                </h2>
                <p className="mt-1 text-xs text-slate-400">Top 5 students by amount due</p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/sales/fees-due")}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
              >
                View all
                <ArrowRight size={15} />
              </button>
            </div>

            <div className="mt-4">
              {summary.topDues.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-500">
                  No student has a balance. 🎉
                </p>
              ) : (
                summary.topDues.map((student, index) => (
                  <div
                    key={`${student.id}-${index}`}
                    className="flex items-center justify-between gap-3 border-t border-slate-100 py-3 first:border-t-0"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                          AVATAR_COLORS[index % AVATAR_COLORS.length]
                        }`}
                      >
                        {getInitials(student.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {student.name}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {student.id}
                          {student.department ? ` · ${student.department}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <StatusBadge status={student.status} />
                      <span className="w-24 text-right text-sm font-semibold text-slate-900">
                        {formatFull(student.due)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <div className="mt-10 flex flex-col justify-between gap-2 border-t border-slate-200 pt-5 text-xs text-slate-400 sm:flex-row">
          <span>© 2026 AI Student Analytics</span>
          <span>
            Data from {source.name} · uploaded {formatDate(source.uploadedAt)}
          </span>
        </div>
      </div>
    </main>
  );
}