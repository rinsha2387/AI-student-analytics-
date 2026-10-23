import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminTopbar from "../../components/admin/AdminTopbar";

const API_URL = "http://localhost:5000/api/admin/ai-config";

const RESPONSE_FORMATS = [
  { value: "json", label: "Structured JSON" },
  { value: "text", label: "Plain text" },
];

const DEFAULT_FORM = {
  model: "",
  temperature: "0.2",
  maxOutputTokens: "4096",
  responseFormat: "json",
  timeoutSeconds: "120",
  retryAttempts: "3",
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50 disabled:text-slate-500";

const labelClass = "mb-2 block text-sm font-semibold text-[#1b3154]";
const hintClass = "mt-1.5 text-xs text-slate-400";

// Convert the saved config from the API into form (string) values.
const toForm = (config) => ({
  model: config.model || "",
  temperature: String(config.temperature),
  maxOutputTokens: String(config.maxOutputTokens),
  responseFormat: config.responseFormat,
  timeoutSeconds: String(config.timeoutSeconds),
  retryAttempts: String(config.retryAttempts),
});

export default function AIConfiguration() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();

  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [defaultModel, setDefaultModel] = useState("");
  const [modelOptions, setModelOptions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);

  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState({ type: "", text: "" });

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const response = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load the AI configuration.");
      }

      setFormData(toForm(data.config));
      setApiKeyConfigured(Boolean(data.config.apiKeyConfigured));
      setDefaultModel(data.config.defaultModel || "");
    } catch (err) {
      setLoadError(
        err.message ||
          "Could not connect to the server. Check that your backend is running.",
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  // Returns an error message, or an empty string when the form is valid.
  const validate = () => {
    const temperature = Number(formData.temperature);
    const tokens = Number(formData.maxOutputTokens);
    const timeout = Number(formData.timeoutSeconds);
    const retries = Number(formData.retryAttempts);

    if (!formData.model.trim() && !defaultModel) {
      return "Model name is required.";
    }

    if (formData.temperature === "" || temperature < 0 || temperature > 2) {
      return "Temperature must be between 0 and 2.";
    }
    if (!Number.isInteger(tokens) || tokens < 1 || tokens > 100000) {
      return "Maximum output tokens must be a whole number from 1 to 100,000.";
    }
    if (!Number.isInteger(timeout) || timeout < 10 || timeout > 600) {
      return "Timeout must be between 10 and 600 seconds.";
    }
    if (!Number.isInteger(retries) || retries < 0 || retries > 10) {
      return "Retry attempts must be between 0 and 10.";
    }

    return "";
  };

  const handleSave = async () => {
    const validationError = validate();

    if (validationError) {
      setNotice({ type: "error", text: validationError });
      return;
    }

    setSaving(true);
    setNotice({ type: "", text: "" });

    try {
      const body = {
        model: formData.model.trim(),
        temperature: Number(formData.temperature),
        maxOutputTokens: Number(formData.maxOutputTokens),
        responseFormat: formData.responseFormat,
        timeoutSeconds: Number(formData.timeoutSeconds),
        retryAttempts: Number(formData.retryAttempts),
      };

      const response = await fetch(API_URL, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not save the configuration.");
      }

      setFormData(toForm(data.config));
      setApiKeyConfigured(Boolean(data.config.apiKeyConfigured));
      setDefaultModel(data.config.defaultModel || "");
      setNotice({
        type: "success",
        text: "AI configuration saved successfully.",
      });
    } catch (err) {
      setNotice({
        type: "error",
        text: err.message || "Could not save the configuration.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setNotice({ type: "", text: "" });

    try {
      const response = await fetch(`${API_URL}/test`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ model: formData.model.trim() }),
      });

      const data = await response.json();

      setNotice({
        type: response.ok ? "success" : "error",
        text: data.message || "Connection test finished.",
      });
    } catch (err) {
      setNotice({
        type: "error",
        text: "Could not connect to the server. Check that your backend is running.",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleLoadModels = async () => {
    setLoadingModels(true);
    setNotice({ type: "", text: "" });

    try {
      const response = await fetch(`${API_URL}/models`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load the models.");
      }

      setModelOptions(data.models);
      setNotice({
        type: "success",
        text: `${data.models.length} models loaded. Click the Model field to choose one.`,
      });
    } catch (err) {
      setNotice({
        type: "error",
        text: err.message || "Could not load the models.",
      });
    } finally {
      setLoadingModels(false);
    }
  };

  const busy = saving || testing || loadingModels;

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-800">
      <AdminSidebar
        activeMenu="AI Configuration"
        adminName={user?.name || "System Admin"}
        onMenuClick={handleMenuClick}
        onLogout={handleLogout}
      />

      <div className="min-h-screen lg:ml-[288px]">
        <AdminTopbar user={user} activeMenu="AI Configuration" />

        <main className="space-y-6 p-5 md:p-8">
          {/* Page heading */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#5268d8]">
              AI & Configuration
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1b3154]">
              AI Configuration
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage your analysis service settings and connection preferences.
            </p>
          </section>

          {/* Load error */}
          {loadError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <p>{loadError}</p>

              <button
                type="button"
                onClick={loadConfig}
                className="mt-2 font-semibold underline"
              >
                Retry loading
              </button>
            </div>
          )}

          {/* Save, test and load messages */}
          {notice.text && (
            <div
              role="status"
              className={`rounded-lg border p-4 text-sm ${
                notice.type === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {notice.text}
            </div>
          )}

          {loading ? (
            <section className="flex min-h-64 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-400">
              Loading AI configuration...
            </section>
          ) : (
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="p-6 md:p-8">
                <h2 className="text-xl font-semibold text-[#1b3154]">
                  Model settings
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Settings for future analyses
                </p>

                <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                  <div>
                    <label htmlFor="ai-provider" className={labelClass}>
                      AI provider
                    </label>
                    <input
                      id="ai-provider"
                      type="text"
                      value="Google Gemini"
                      disabled
                      readOnly
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="ai-model" className={labelClass}>
                      Model
                    </label>
                    <input
                      id="ai-model"
                      name="model"
                      type="text"
                      list="gemini-models"
                      value={formData.model}
                      onChange={handleChange}
                      disabled={busy}
                      placeholder={defaultModel || "e.g. gemini-3.8-flash"}
                      autoComplete="off"
                      className={inputClass}
                    />
                    <datalist id="gemini-models">
                      {modelOptions.map((name) => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                    <p className={hintClass}>
                      {defaultModel
                        ? `Leave empty to use the server default (${defaultModel}). `
                        : "Model names change often. "}
                      <button
                        type="button"
                        onClick={handleLoadModels}
                        disabled={busy}
                        className="font-semibold text-[#5268d8] hover:underline disabled:opacity-50"
                      >
                        {loadingModels ? "Loading..." : "Load available models"}
                      </button>
                    </p>
                  </div>

                  <div>
                    <label htmlFor="ai-temperature" className={labelClass}>
                      Temperature
                    </label>
                    <input
                      id="ai-temperature"
                      name="temperature"
                      type="number"
                      min="0"
                      max="2"
                      step="0.1"
                      value={formData.temperature}
                      onChange={handleChange}
                      disabled={busy}
                      className={inputClass}
                    />
                    <p className={hintClass}>
                      Lower values give more consistent results. Range: 0 to 2.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="ai-max-tokens" className={labelClass}>
                      Maximum output tokens
                    </label>
                    <input
                      id="ai-max-tokens"
                      name="maxOutputTokens"
                      type="number"
                      min="1"
                      max="100000"
                      step="1"
                      value={formData.maxOutputTokens}
                      onChange={handleChange}
                      disabled={busy}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="ai-format" className={labelClass}>
                      Response format
                    </label>
                    <select
                      id="ai-format"
                      name="responseFormat"
                      value={formData.responseFormat}
                      onChange={handleChange}
                      disabled={busy}
                      className={inputClass}
                    >
                      {RESPONSE_FORMATS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="ai-timeout" className={labelClass}>
                      Timeout (seconds)
                    </label>
                    <input
                      id="ai-timeout"
                      name="timeoutSeconds"
                      type="number"
                      min="10"
                      max="600"
                      step="1"
                      value={formData.timeoutSeconds}
                      onChange={handleChange}
                      disabled={busy}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="ai-retries" className={labelClass}>
                      Retry attempts
                    </label>
                    <input
                      id="ai-retries"
                      name="retryAttempts"
                      type="number"
                      min="0"
                      max="10"
                      step="1"
                      value={formData.retryAttempts}
                      onChange={handleChange}
                      disabled={busy}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="ai-api-key" className={labelClass}>
                      API key
                    </label>
                    <input
                      id="ai-api-key"
                      type="text"
                      value={
                        apiKeyConfigured
                          ? "Configured on the server"
                          : "Not configured"
                      }
                      disabled
                      readOnly
                      className={`${inputClass} ${
                        apiKeyConfigured ? "" : "text-rose-600"
                      }`}
                    />
                    <p className={hintClass}>
                      {apiKeyConfigured
                        ? "The key is read from GEMINI_API_KEY in the server .env file."
                        : "Add GEMINI_API_KEY to the server .env file and restart the server."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 px-6 py-5 md:px-8">
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={busy}
                  className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  {testing ? "Testing..." : "Test connection"}
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={busy}
                  className="rounded-lg bg-[#5268d8] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4355c4] disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save configuration"}
                </button>
              </div>
            </section>
          )}

          <footer className="flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-5 text-[11px] text-slate-400">
            <span>© {new Date().getFullYear()} AI Student Analytics</span>
            <span>Insights support human judgment</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
