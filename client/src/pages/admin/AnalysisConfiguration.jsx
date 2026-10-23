
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminTopbar from "../../components/admin/AdminTopbar";

const DEFAULT_CONFIG = {
  maxFileSizeMB: "25",
  allowedFileTypes: "CSV, XLSX, XLS",
  maxRows: "50000",
  requiredFields: "Student ID",
  supportedFields: "Attendance, Marks, Assignments, Fees",
  timeoutSeconds: "120",
  reportFormats: "CSV, PDF",
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-[#1b3154] outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

const labelClass =
  "mb-2 block text-sm font-semibold text-[#1b3154]";

export default function AnalysisConfiguration() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [formData, setFormData] = useState(DEFAULT_CONFIG);
  const [notice, setNotice] = useState({
    type: "",
    text: "",
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setNotice({ type: "", text: "" });
  };

  const handleMenuClick = (item) => {
    const name = typeof item === "string" ? item : item?.name;

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

    if (routes[name]) {
      navigate(routes[name]);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const validate = () => {
    const maxFileSize = Number(formData.maxFileSizeMB);
    const maxRows = Number(formData.maxRows);
    const timeout = Number(formData.timeoutSeconds);

    if (!Number.isFinite(maxFileSize) || maxFileSize < 1 || maxFileSize > 500) {
      return "Maximum file size must be between 1 and 500 MB.";
    }

    if (!Number.isInteger(maxRows) || maxRows < 1 || maxRows > 1000000) {
      return "Maximum rows must be a whole number between 1 and 1,000,000.";
    }

    if (!Number.isInteger(timeout) || timeout < 10 || timeout > 600) {
      return "Analysis timeout must be between 10 and 600 seconds.";
    }

    if (!formData.allowedFileTypes.trim()) {
      return "Enter at least one allowed file type.";
    }

    if (!formData.requiredFields.trim()) {
      return "Enter at least one required field.";
    }

    if (!formData.supportedFields.trim()) {
      return "Enter the supported data fields.";
    }

    if (!formData.reportFormats.trim()) {
      return "Enter at least one report format.";
    }

    return "";
  };

  const handleSave = async (event) => {
    event.preventDefault();

    const error = validate();

    if (error) {
      setNotice({ type: "error", text: error });
      return;
    }

    // Backend API integration will be added in the next step.
    setNotice({
      type: "info",
      text: "Validation successful. Connect the backend API to save these settings permanently.",
    });
  };

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-800">
      <AdminSidebar
        activeMenu="Analysis Configuration"
        adminName={user?.name || "System Admin"}
        onMenuClick={handleMenuClick}
        onLogout={handleLogout}
      />

      <div className="min-h-screen lg:ml-[288px]">
        <AdminTopbar
          user={user}
          activeMenu="Analysis Configuration"
        />

        <main className="space-y-7 p-5 md:p-8">
          {/* Page heading */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#5268d8]">
              AI &amp; Configuration
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1b3154]">
              Analysis Configuration
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Control dataset requirements, file limits, and report defaults.
            </p>
          </section>

          {notice.text && (
            <div
              role="status"
              className={`rounded-lg border p-4 text-sm ${
                notice.type === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-indigo-200 bg-indigo-50 text-indigo-700"
              }`}
            >
              {notice.text}
            </div>
          )}

          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            {/* Dataset settings form */}
            <form
              onSubmit={handleSave}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="p-6 md:p-7">
                <h2 className="text-lg font-semibold text-[#1b3154]">
                  Dataset settings
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Upload and processing limits
                </p>

                <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                  <div>
                    <label htmlFor="maxFileSizeMB" className={labelClass}>
                      Maximum file size (MB)
                    </label>
                    <input
                      id="maxFileSizeMB"
                      name="maxFileSizeMB"
                      type="number"
                      min="1"
                      max="500"
                      value={formData.maxFileSizeMB}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="allowedFileTypes" className={labelClass}>
                      Allowed file types
                    </label>
                    <input
                      id="allowedFileTypes"
                      name="allowedFileTypes"
                      value={formData.allowedFileTypes}
                      onChange={handleChange}
                      placeholder="CSV, XLSX, XLS"
                      className={inputClass}
                      required
                    />
                    <p className="mt-1.5 text-xs text-slate-400">
                      Separate file extensions with commas.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="maxRows" className={labelClass}>
                      Maximum rows
                    </label>
                    <input
                      id="maxRows"
                      name="maxRows"
                      type="number"
                      min="1"
                      max="1000000"
                      value={formData.maxRows}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="requiredFields" className={labelClass}>
                      Required fields
                    </label>
                    <input
                      id="requiredFields"
                      name="requiredFields"
                      value={formData.requiredFields}
                      onChange={handleChange}
                      placeholder="Student ID"
                      className={inputClass}
                      required
                    />
                    <p className="mt-1.5 text-xs text-slate-400">
                      Columns every uploaded dataset must contain.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="supportedFields" className={labelClass}>
                      Supported data fields
                    </label>
                    <input
                      id="supportedFields"
                      name="supportedFields"
                      value={formData.supportedFields}
                      onChange={handleChange}
                      placeholder="Attendance, Marks, Assignments, Fees"
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="timeoutSeconds" className={labelClass}>
                      Analysis timeout (seconds)
                    </label>
                    <input
                      id="timeoutSeconds"
                      name="timeoutSeconds"
                      type="number"
                      min="10"
                      max="600"
                      value={formData.timeoutSeconds}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="reportFormats" className={labelClass}>
                      Report formats
                    </label>
                    <input
                      id="reportFormats"
                      name="reportFormats"
                      value={formData.reportFormats}
                      onChange={handleChange}
                      placeholder="CSV, PDF"
                      className={inputClass}
                      required
                    />
                    <p className="mt-1.5 text-xs text-slate-400">
                      Separate formats with commas.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-100 px-6 py-5 md:px-7">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#5268d8] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4355c4] disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save configuration"}
                </button>
              </div>
            </form>

            {/* Protected configuration information */}
            <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center text-emerald-600">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-8 w-8"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-3Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m9 12 2 2 4-4"
                  />
                </svg>
              </div>

              <h2 className="mt-4 text-base font-medium text-[#1b3154]">
                Protected configuration
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Only authorized administrators can access these settings.
                API keys are never displayed in full.
              </p>

              <div className="my-6 border-t border-slate-100" />

              <p className="text-sm leading-6 text-slate-400">
                Management users only upload data and review results.
                Analysis instructions remain on the administrator side.
              </p>
            </aside>
          </div>

          {/* Footer */}
          <footer className="flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-5 text-[11px] text-slate-400">
            <span>
              © {new Date().getFullYear()} AI Student Analytics
            </span>
            <span>Insights support human judgment</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
