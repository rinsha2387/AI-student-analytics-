// Temporary page for the sales side.
// Replace it with your real pages (financial impact, fees due, fees paid).
export default function SalesPlaceholder({ title }) {
  return (
    <main className="min-h-screen bg-[#fafafc] px-5 py-8 sm:px-8 lg:px-10">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        {title}
      </h1>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
        Your sales dashboard is ready. The financial data for this page will
        appear here.
      </div>
    </main>
  );
}