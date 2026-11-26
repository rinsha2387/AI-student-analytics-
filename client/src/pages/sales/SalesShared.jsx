// Small helpers shared by the sales pages.
import { AlertCircle, FileSpreadsheet, LoaderCircle, RefreshCw } from "lucide-react";

export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");

// ₹12.4L, ₹1.25Cr, ₹85,000
export const formatShort = (value) => {
  if (value === null || value === undefined) return "N/A";
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
};

export const formatFull = (value) =>
  value === null || value === undefined
    ? "—"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(value);

// 30 Sep 2026
export const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

export const getInitials = (name) =>
  String(name || "")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const AVATAR_COLORS = [
  "bg-indigo-50 text-indigo-600",
  "bg-teal-50 text-teal-600",
  "bg-purple-50 text-purple-600",
  "bg-sky-50 text-sky-600",
  "bg-rose-50 text-rose-600",
];

const STATUS_STYLES = {
  Paid: "bg-emerald-50 text-emerald-700",
  Partial: "bg-sky-50 text-sky-700",
  Pending: "bg-orange-50 text-orange-600",
  Overdue: "bg-red-50 text-red-600",
  Unknown: "bg-slate-100 text-slate-600",
};

export function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${
        STATUS_STYLES[status] || STATUS_STYLES.Unknown
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

// Calls a sales API route and returns the JSON (or throws a readable error).
export const fetchSales = async (token, path, params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, value);
  });

  const response = await fetch(`${API_URL}/sales/${path}?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
};

export function PageLoading({ text }) {
  return (
    <main className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <LoaderCircle className="mx-auto animate-spin text-indigo-600" size={34} />
        <p className="mt-4 text-sm text-slate-500">{text}</p>
      </div>
    </main>
  );
}

export function PageError({ title, message, onRetry }) {
  return (
    <main className="min-h-[60vh] px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <AlertCircle className="mx-auto text-red-500" size={38} />
        <h1 className="mt-4 text-xl font-semibold text-slate-900">{title}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">{message}</p>
        <button
          onClick={onRetry}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          <RefreshCw size={16} />
          Try again
        </button>
      </div>
    </main>
  );
}

// Shown when the uploaded file has no fee columns.
export function NoFeeData({ title, fileName }) {
  return (
    <main className="min-h-[60vh] px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <FileSpreadsheet className="mx-auto text-slate-400" size={38} />
        <h1 className="mt-4 text-xl font-semibold text-slate-900">{title}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
          No fee columns were found in the latest upload
          {fileName ? ` (${fileName})` : ""}. Ask your manager to upload a file with columns
          such as <strong>Fees Due</strong>, <strong>Fees Paid</strong> and{" "}
          <strong>Due Date</strong>.
        </p>
      </div>
    </main>
  );
}

export const downloadCSV = (filename, headers, rows) => {
  const escapeCSV = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

  const csv = [headers, ...rows].map((row) => row.map(escapeCSV).join(",")).join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};