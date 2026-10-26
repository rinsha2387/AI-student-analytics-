import { useState, useEffect } from "react";
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

const API_URL = "http://localhost:5000/api/admin/analysis-config";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-[#1b3154] outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

const labelClass = "mb-2 block text-sm font-semibold text-[#1b3154]";

export default function AnalysisConfiguration() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();

  const [formData, setFormData] = useState(DEFAULT_CONFIG);
  const [notice, setNotice] = useState({
    type: "",
    text: "",
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchConfig = async () => {
      try {
        const response = await fetch(API_URL, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load configuration.");
        }

        // Supports either a direct config response or { config: {...} }
        const config = data.config || data;

        setFormData({
          maxFileSizeMB: String(
            config.maxFileSizeMB ?? DEFAULT_CONFIG.maxFileSizeMB,
          ),
          allowedFileTypes:
            config.allowedFileTypes ?? DEFAULT_CONFIG.allowedFileTypes,
          maxRows: String(config.maxRows ?? DEFAULT_CONFIG.maxRows),
          requiredFields:
            config.requiredFields ?? DEFAULT_CONFIG.requiredFields,
          supportedFields:
            config.supportedFields ?? DEFAULT_CONFIG.supportedFields,
          timeoutSeconds: String(
            config.timeoutSeconds ?? DEFAULT_CONFIG.timeoutSeconds,
          ),
          reportFormats: config.reportFormats ?? DEFAULT_CONFIG.reportFormats,
        });
      } catch (error) {
        setNotice({
          type: "error",
          text: error.message || "Unable to load configuration.",
        });
      }
    };

    fetchConfig();
  }, [token]);

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

    const validationError = validate();

    if (validationError) {
      setNotice({ type: "error", text: validationError });
      return;
    }

    if (!token) {
      setNotice({
        type: "error",
        text: "Your session has expired. Please log in again.",
      });
      return;
    }

    try {
      setSaving(true);
      setNotice({ type: "", text: "" });

      const payload = {
        ...formData,
        maxFileSizeMB: Number(formData.maxFileSizeMB),
        maxRows: Number(formData.maxRows),
        timeoutSeconds: Number(formData.timeoutSeconds),
      };

      const response = await fetch(API_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save configuration.");
      }

      const config = data.config || data;

      setFormData({
        maxFileSizeMB: String(config.maxFileSizeMB ?? payload.maxFileSizeMB),
        allowedFileTypes: config.allowedFileTypes ?? payload.allowedFileTypes,
        maxRows: String(config.maxRows ?? payload.maxRows),
        requiredFields: config.requiredFields ?? payload.requiredFields,
        supportedFields: config.supportedFields ?? payload.supportedFields,
        timeoutSeconds: String(config.timeoutSeconds ?? payload.timeoutSeconds),
        reportFormats: config.reportFormats ?? payload.reportFormats,
      });

      setNotice({
        type: "success",
        text: "Analysis configuration saved successfully.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        text: error.message || "Unable to save configuration.",
      });
    } finally {
      setSaving(false);
    }
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
        <AdminTopbar user={user} activeMenu="Analysis Configuration" />

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
                  : notice.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
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

         
          </div>

          {/* Footer */}
          <footer className="flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-5 text-[11px] text-slate-400">
            <span>© {new Date().getFullYear()} AI Student Analytics</span>
            <span>Insights support human judgment</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
