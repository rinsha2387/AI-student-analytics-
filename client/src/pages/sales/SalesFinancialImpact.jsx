import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
// Change this path if you save InsightParts.jsx somewhere else.
import {
  BarChart,
  InsightBlock,
  StatCard,
  formatNumber,
} from "../../components/manager/InsightParts";
import { Activity, AlertCircle, Sparkles, Users, Wallet } from "lucide-react";
import {
  NoFeeData,
  PageError,
  PageLoading,
  fetchSales,
  formatDate,
  formatFull,
  formatShort,
} from "./SalesShared";

export default function SalesFinancialImpact() {
  const { token } = useAuth();

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

  if (loading) return <PageLoading text="Loading financial impact..." />;
  if (error || !data) {
    return <PageError title="Financial impact analysis" message={error || "No data."} onRetry={load} />;
  }

  const { summary, source } = data;

  if (!summary.available) {
    return <NoFeeData title="Financial impact analysis" fileName={source.fileName} />;
  }

  const summaryText =
    summary.studentsWithDues === 0
      ? `Every student with fee data has paid in full. ${formatFull(summary.totalPaid)} has been collected.`
      : `${summary.studentsWithDues} students have an outstanding balance, ${formatFull(summary.totalDue)} in total. ${
          summary.hasDueDates
            ? `${summary.overdueCount} of them are past their due date (${formatFull(summary.overdueAmount)}).`
            : "Due dates are not in the data, so overdue balances cannot be shown."
        } ${formatFull(summary.totalPaid)} has been collected so far${
          summary.collectionRate !== null ? `, which is ${summary.collectionRate}% of the fees billed` : ""
        }.`;

  const methodText =
    "Amounts come only from the fee columns in the latest uploaded dataset (fees due, fees paid, total fee and due date). When one of fees due or fees paid is missing, it is worked out from the total fee. A student is Overdue when a balance remains after the due date.";

  return (
    <main className="min-h-screen bg-[#fafafc] px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-600">
            Financial intelligence
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
            Financial impact analysis
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            Financial indicators based only on financial fields available in the dataset.
          </p>
        </div>

        <section className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Wallet}
            tone="indigo"
            value={formatShort(summary.totalDue)}
            label="Outstanding amount"
            description="From available records"
          />
          <StatCard
            icon={Users}
            tone="orange"
            value={formatNumber(summary.studentsWithDues)}
            label="Outstanding fees"
            description="Students with a balance"
          />
          <StatCard
            icon={AlertCircle}
            tone="red"
            value={summary.hasDueDates ? formatNumber(summary.overdueCount) : "N/A"}
            label="Overdue"
            description={
              summary.hasDueDates
                ? `${formatShort(summary.overdueAmount)} past the due date`
                : "Due dates not in the data"
            }
          />
          <StatCard
            icon={Activity}
            tone="teal"
            value={summary.collectionRate === null ? "N/A" : `${summary.collectionRate}%`}
            label="Collection rate"
            description="Verify against records"
          />
        </section>

        <section className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
          <BarChart
            title={summary.outstandingChart.title}
            subtitle={summary.outstandingChart.subtitle}
            data={summary.outstandingChart.data}
            emptyText="No outstanding balances."
          />

          <BarChart
            title="Fee status distribution"
            subtitle="Number of students by payment status"
            data={summary.statusChart}
            palette="teal"
          />
        </section>

        {summary.collectionsByMonth.available && (
          <section className="mb-6">
            <BarChart
              title="Collections by month"
              subtitle="Payments received, in ₹ lakh"
              data={summary.collectionsByMonth.data}
              palette="teal"
            />
          </section>
        )}

        <section className="rounded-2xl border border-indigo-100 bg-[#f6f7fe] p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100/70 text-indigo-600">
              <Sparkles size={20} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-indigo-600">
                Data summary
              </p>
              <h2 className="mt-2 text-lg font-medium text-slate-900">
                Interpret financial data in context
              </h2>

              <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2">
                <InsightBlock label="Financial summary" item={{ text: summaryText }} />
                <InsightBlock label="How these numbers are calculated" item={{ text: methodText }} />
              </div>

              <p className="mt-5 text-xs text-slate-400">
                Financial analysis is based only on financial information available in the
                uploaded dataset. Verify amounts with authorized records.
              </p>
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