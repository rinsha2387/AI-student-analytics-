import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  CheckCircle2,
  LoaderCircle,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");

const ROLE_LABELS = { manager: "Management", sales: "Sales team", admin: "Admin" };

const NOTIFICATION_ROWS = [
  {
    key: "email",
    title: "Email notifications",
    description: "Receive important updates by email",
  },
  {
    key: "analysis",
    title: "Analysis updates",
    description: "Get notified when a report is ready",
  },
  {
    key: "teamRequests",
    title: "Team join requests",
    description: "Show a notice when someone asks to join your institution",
  },
];

const getInitials = (name) =>
  String(name || "")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
};

function ReadOnlyField({ label, value, hint }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-slate-800">{label}</label>
      <input
        value={value}
        disabled
        readOnly
        className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-500 outline-none"
      />
      {hint && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { token, refreshUser, logout } = useAuth();

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: "", text: "" });

  const [savingKey, setSavingKey] = useState("");
  const [notificationMessage, setNotificationMessage] = useState({ type: "", text: "" });

  // People waiting to join this institution (the notification bar)
  const [requests, setRequests] = useState([]);
  const [notify, setNotify] = useState(true);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not load your settings.");
      }

      setSettings(data);
      setName(data.profile.name);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Check for join requests now, then every 30 seconds.
  const loadRequests = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/team`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setRequests(Array.isArray(data.pending) ? data.pending : []);
        setNotify(data.notify !== false);
      }
    } catch {
      // ignore network errors; try again on the next check
    }
  }, [token]);

  useEffect(() => {
    loadRequests();

    const timer = setInterval(loadRequests, 30000);
    window.addEventListener("focus", loadRequests);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", loadRequests);
    };
  }, [loadRequests]);

  const saveProfile = async (event) => {
    event.preventDefault();

    setSavingProfile(true);
    setProfileMessage({ type: "", text: "" });

    try {
      const response = await fetch(`${API_URL}/settings/profile`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ name }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not save your profile.");
      }

      setSettings((value) => ({
        ...value,
        profile: { ...value.profile, name: data.user.name },
      }));
      setName(data.user.name);
      setProfileMessage({ type: "success", text: "Profile saved." });

      // Update the name shown in the top bar.
      refreshUser();
    } catch (err) {
      setProfileMessage({ type: "error", text: err.message });
    } finally {
      setSavingProfile(false);
    }
  };

  const toggleNotification = async (key, value) => {
    const previous = settings.notifications;

    // Show the change at once, and undo it if saving fails.
    setSettings((current) => ({
      ...current,
      notifications: { ...current.notifications, [key]: value },
    }));
    setSavingKey(key);
    setNotificationMessage({ type: "", text: "" });

    try {
      const response = await fetch(`${API_URL}/settings/notifications`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ [key]: value }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not save this setting.");
      }

      setSettings((current) => ({ ...current, notifications: data.notifications }));
      setNotificationMessage({ type: "success", text: "Saved." });

      if (key === "teamRequests") loadRequests();
    } catch (err) {
      setSettings((current) => ({ ...current, notifications: previous }));
      setNotificationMessage({ type: "error", text: err.message });
    } finally {
      setSavingKey("");
    }
  };

  const handleSignOut = () => {
    logout();
    navigate("/login", { replace: true });
  };

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <LoaderCircle className="mx-auto animate-spin text-indigo-600" size={34} />
          <p className="mt-4 text-sm text-slate-500">Loading your settings...</p>
        </div>
      </main>
    );
  }

  if (error || !settings) {
    return (
      <main className="min-h-[60vh] px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto text-red-500" size={38} />
          <h1 className="mt-4 text-xl font-semibold text-slate-900">Settings</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
            {error || "Settings are not available."}
          </p>
          <button
            onClick={loadSettings}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      </main>
    );
  }

  const { profile, notifications } = settings;
  const nameChanged = name.trim() !== profile.name;
  const showBar = notify && requests.length > 0;

  return (
    <main className="min-h-screen bg-[#fafafc] px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1600px]">
        {/* Heading */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-600">
            Account
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
            Settings
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            Manage your profile, security, and workspace preferences.
          </p>
        </div>

        {/* Notification bar: someone wants to join this institution */}
        {showBar && (
          <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-orange-100 bg-orange-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <Users size={19} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {requests.length === 1
                    ? `${requests[0].name} wants to join ${profile.institution.name}`
                    : `${requests.length} people want to join ${profile.institution.name}`}
                </p>
                <p className="mt-0.5 text-sm text-slate-600">
                  {requests.length === 1
                    ? `${requests[0].email} is waiting for your approval.`
                    : `${requests
                        .slice(0, 2)
                        .map((person) => person.name)
                        .join(", ")}${requests.length > 2 ? " and others" : ""} are waiting for your approval.`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/manager/team")}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Review in Team access
              <ArrowRight size={15} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
          {/* Profile */}
          <form
            onSubmit={saveProfile}
            className="self-start rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"
          >
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              Profile information
            </h2>
            <p className="mt-1 text-xs text-slate-400">Your account details</p>

            <div className="mt-6 flex items-center gap-4 border-b border-slate-200 pb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eee5d6] text-base font-semibold text-[#765d3c]">
                {getInitials(profile.name)}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{profile.name}</p>
                <p className="mt-0.5 text-sm text-slate-400">
                  {ROLE_LABELS[profile.role] || profile.role}
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-2 block text-xs font-semibold text-slate-800"
                >
                  Full name
                </label>
                <input
                  id="fullName"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setProfileMessage({ type: "", text: "" });
                  }}
                  maxLength={60}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>

              <ReadOnlyField
                label="Email address"
                value={profile.email}
                hint="You sign in with this email, so it cannot be changed here."
              />

              <ReadOnlyField
                label="Institution"
                value={profile.institution.name}
                hint="Linked to your team."
              />

              <ReadOnlyField label="City" value={profile.institution.city} />
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <button
                type="submit"
                disabled={savingProfile || !nameChanged}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingProfile && <LoaderCircle size={16} className="animate-spin" />}
                Save profile
              </button>

              {profileMessage.text && (
                <span
                  className={`inline-flex items-center gap-1.5 text-sm ${
                    profileMessage.type === "success" ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  {profileMessage.type === "success" && <CheckCircle2 size={15} />}
                  {profileMessage.text}
                </span>
              )}
            </div>
          </form>

          {/* Notifications and security */}
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                    Notifications
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Choose what you would like to hear about
                  </p>
                </div>

                {notificationMessage.text && (
                  <span
                    className={`text-xs ${
                      notificationMessage.type === "success"
                        ? "text-emerald-600"
                        : "text-red-500"
                    }`}
                  >
                    {notificationMessage.text}
                  </span>
                )}
              </div>

              <div className="mt-6 border-t border-slate-200">
                {NOTIFICATION_ROWS.map((row) => (
                  <label
                    key={row.key}
                    className="flex cursor-pointer items-center justify-between gap-4 border-b border-slate-200 py-4 last:border-b-0"
                  >
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">
                        {row.title}
                      </span>
                      <span className="mt-1 block text-xs text-slate-400">
                        {row.description}
                      </span>
                    </span>

                    <input
                      type="checkbox"
                      checked={notifications[row.key]}
                      disabled={savingKey === row.key}
                      onChange={(event) => toggleNotification(row.key, event.target.checked)}
                      className="h-5 w-5 shrink-0 cursor-pointer rounded accent-indigo-600"
                    />
                  </label>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">Security</h2>
              <p className="mt-1 text-xs text-slate-400">Keep your account protected</p>

              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck size={22} className="mt-0.5 shrink-0 text-slate-400" />
                  <p className="text-sm leading-6 text-slate-600">
                    You sign in with a one-time code sent to your email, so there is no
                    password to change or lose.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <Mail size={22} className="mt-0.5 shrink-0 text-slate-400" />
                  <p className="text-sm leading-6 text-slate-600">
                    Member since {formatDate(profile.memberSince)}
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <Bell size={22} className="mt-0.5 shrink-0 text-slate-400" />
                  <p className="text-sm leading-6 text-slate-600">
                    Codes expire after 5 minutes. Never share a code with anyone.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 flex flex-col justify-between gap-2 border-t border-slate-200 pt-5 text-xs text-slate-400 sm:flex-row">
          <span>© 2026 AI Student Analytics</span>
          <span>Insights support human judgment</span>
        </div>
      </div>
    </main>
  );
}