
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminTopbar from "../../components/admin/AdminTopbar";

const API_URL = "http://localhost:5000/api/admin/ai-prompt";

const OUTPUT_SECTIONS = [
  { key: "executiveSummary", label: "Executive Summary" },
  {
    key: "studentsRequiringReview",
    label: "Students Requiring Review",
  },
  { key: "academicInsights", label: "Academic Insights" },
  { key: "attendanceInsights", label: "Attendance Insights" },
  { key: "behavioralInsights", label: "Behavioral Insights" },
  { key: "financialImpact", label: "Financial Impact" },
  {
    key: "dataQualityObservations",
    label: "Data Quality Observations",
  },
  { key: "supportingIndicators", label: "Supporting Indicators" },
  {
    key: "managementReviewSuggestions",
    label: "Management Review Suggestions",
  },
];

const DEFAULT_PROMPT = {
  name: "Student Analytics Master Prompt",
  description:
    "Analyze uploaded student data and generate evidence-based insights.",
  systemInstruction: `You are an AI assistant for student analytics.

Analyze the uploaded student records using the available attendance,
examination marks, assessments, and other relevant fields.

Generate a complete analysis containing:
1. An executive summary.
2. Students who may require additional academic review.
3. Academic performance insights.
4. Attendance insights.
5. Evidence-based behavioral observations, where supported by data.
6. Financial impact estimates, only when sufficient financial data exists.
7. Data quality observations.
8. Supporting indicators for findings.
9. Suggestions for management review.

Do not invent missing data, causes, or financial figures.
Clearly distinguish observed facts from estimates.
Treat risk classifications as indicators for human review,
not definitive judgments about students.

Return one complete, structured JSON analysis.`,
  outputSections: OUTPUT_SECTIONS.map((item) => item.key),
  version: "v1.0",
  status: "active",
};

export default function AIPrompts() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();

  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [formData, setFormData] = useState(DEFAULT_PROMPT);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  // Load the saved master prompt.
  const loadPrompt = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load the AI prompt.");
      }

      if (data.prompt) {
        const savedPrompt = {
          ...DEFAULT_PROMPT,
          ...data.prompt,
          outputSections: Array.isArray(data.prompt.outputSections)
            ? data.prompt.outputSections
            : DEFAULT_PROMPT.outputSections,
        };

        setPrompt(savedPrompt);
        setFormData(savedPrompt);
      } else {
        // No prompt exists yet. The default can be saved by the admin.
        setPrompt(DEFAULT_PROMPT);
        setFormData(DEFAULT_PROMPT);
      }
    } catch (err) {
      setError(
        err.message ||
          "Could not connect to the server. Check that your backend is running."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadPrompt();
  }, [loadPrompt]);

  const handleMenuClick = (item) => {
    const name = typeof item === "string" ? item : item?.name;

    const routes = {
      Dashboard: "/admin/dashboard",
      "Management Users": "/admin/management-users",
      "Student Data": "/admin/student-data",
      "AI Prompts": "/admin/ai-prompts",
      "AI Configuration": "/admin/ai-configuration",
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

  const handleEdit = () => {
    setFormData(prompt);
    setIsEditing(true);
    setMessage("");
    setError("");
  };

  const handleCancel = () => {
    setFormData(prompt);
    setIsEditing(false);
    setMessage("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSectionChange = (key) => {
    setFormData((previous) => ({
      ...previous,
      outputSections: previous.outputSections.includes(key)
        ? previous.outputSections.filter((item) => item !== key)
        : [...previous.outputSections, key],
    }));
  };

  const handleSave = async () => {
    if (
      !formData.name.trim() ||
      !formData.systemInstruction.trim()
    ) {
      setError("Prompt name and system instruction are required.");
      return;
    }

    if (formData.outputSections.length === 0) {
      setError("Select at least one AI output section.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(API_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          systemInstruction: formData.systemInstruction.trim(),
          outputSections: formData.outputSections,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not save the AI prompt.");
      }

      const savedPrompt = {
        ...formData,
        ...(data.prompt || {}),
      };

      setPrompt(savedPrompt);
      setFormData(savedPrompt);
      setIsEditing(false);
      setMessage("Master prompt saved successfully.");
      setMessageType("success");
    } catch (err) {
      setError(err.message || "Could not save the AI prompt.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-800">
      {/* Existing admin sidebar */}
      <AdminSidebar
        activeMenu="AI Prompts"
        adminName={user?.name || "System Admin"}
        onMenuClick={handleMenuClick}
        onLogout={handleLogout}
      />

      {/* Same layout structure as ManagementUsers */}
      <div className="min-h-screen lg:ml-[288px]">
        <AdminTopbar user={user} activeMenu="AI Prompts" />

        <main className="space-y-6 p-5 md:p-8">
          {/* Page heading */}
          <section className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#5268d8]">
                AI & Configuration
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1b3154]">
                AI Prompt Configuration
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Manage the master instructions used for student data analysis.
              </p>
            </div>

            {!isEditing && (
              <button
                type="button"
                onClick={handleEdit}
                disabled={loading}
                className="rounded-lg bg-[#5268d8] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4355c4] disabled:opacity-50"
              >
                ✎ Edit Prompt
              </button>
            )}
          </section>

          {/* Information banner */}
          <section className="flex items-start gap-3 rounded-xl border border-amber-200 bg-[#fff9ee] p-4 text-sm text-[#a8732c]">
            <span className="text-lg">ⓘ</span>
            <p>
              Changes to the master prompt affect future AI analyses.
              Management users cannot view or edit these instructions.
            </p>
          </section>

          {/* Error and success messages */}
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <p>{error}</p>

              <button
                type="button"
                onClick={loadPrompt}
                className="mt-2 font-semibold underline"
              >
                Retry loading
              </button>
            </div>
          )}

          {message && (
            <div
              role="status"
              className={`rounded-lg border p-4 text-sm ${
                messageType === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {message}
            </div>
          )}

          {loading ? (
            <section className="flex min-h-64 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-400">
              Loading master prompt...
            </section>
          ) : (
            <>
              {/* Master prompt editor */}
              <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-6">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#5268d8]">
                      Prompt Builder
                    </p>

                    <h2 className="mt-2 text-xl font-semibold text-[#1b3154]">
                      {isEditing ? "Edit master prompt" : "Master prompt"}
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                      One prompt generates the complete student analysis.
                    </p>
                  </div>

                  <span className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {prompt.status === "active" ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="space-y-5 p-6">
                  <div>
                    <label
                      htmlFor="prompt-name"
                      className="mb-2 block text-sm font-semibold text-[#1b3154]"
                    >
                      Prompt name
                    </label>

                    <input
                      id="prompt-name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="prompt-description"
                      className="mb-2 block text-sm font-semibold text-[#1b3154]"
                    >
                      Description
                    </label>

                    <input
                      id="prompt-description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="system-instruction"
                      className="mb-2 block text-sm font-semibold text-[#1b3154]"
                    >
                      System instruction
                    </label>

                    <textarea
                      id="system-instruction"
                      name="systemInstruction"
                      value={formData.systemInstruction}
                      onChange={handleChange}
                      disabled={!isEditing}
                      rows={12}
                      className="w-full resize-y rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                    />

                    <p className="mt-2 text-xs text-slate-400">
                      Instructions guide the AI analysis. Do not include
                      API keys or sensitive personal information here.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold">
                        Prompt version
                      </label>

                      <input
                        value={prompt.version || "v1.0"}
                        readOnly
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold">
                        Status
                      </label>

                      <input
                        value={prompt.status || "active"}
                        readOnly
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm capitalize"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={handleCancel}
                          disabled={saving}
                          className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          onClick={handleSave}
                          disabled={saving}
                          className="rounded-lg bg-[#5268d8] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#4355c4] disabled:opacity-50"
                        >
                          {saving ? "Saving..." : "Save Changes"}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={handleEdit}
                        className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Edit Prompt
                      </button>
                    )}
                  </div>
                </div>
              </section>

              {/* Output configuration */}
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6">
                  <h2 className="font-semibold text-[#1b3154]">
                    AI Output Configuration
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Choose which sections the complete analysis should return.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {OUTPUT_SECTIONS.map((section) => (
                    <label
                      key={section.key}
                      className={`flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-4 text-sm text-slate-600 ${
                        isEditing
                          ? "cursor-pointer hover:border-indigo-300"
                          : "cursor-default"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.outputSections.includes(section.key)}
                        onChange={() => handleSectionChange(section.key)}
                        disabled={!isEditing}
                        className="h-4 w-4 accent-[#5268d8]"
                      />

                      {section.label}
                    </label>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                  <p className="text-xs text-slate-400">
                    Financial insights are generated only when relevant fields exist.
                  </p>

                  {isEditing && (
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="rounded-lg bg-[#5268d8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#4355c4] disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Prompt & Preferences"}
                    </button>
                  )}
                </div>
              </section>
            </>
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
