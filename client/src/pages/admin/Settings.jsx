import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  ShieldCheck,
  Bell,
  LogOut,
  Building2,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminTopbar from "../../components/admin/AdminTopbar";
import { adminService } from "../../services/adminService";

const NOTIFICATION_ITEMS = [
  {
    key: "analysisFailures",
    title: "Analysis failures",
    description: "Get an email when an AI analysis fails.",
  },
  {
    key: "newUserRequests",
    title: "New user requests",
    description: "Get an email when a new user is waiting for approval.",
  },
  {
    key: "systemAlerts",
    title: "System alerts",
    description: "Important problems with processing or the platform.",
  },
  {
    key: "weeklySummary",
    title: "Weekly summary",
    description: "A short report of analyses and activity every week.",
  },
];

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "SA";
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

function Card({ title, subtitle, icon: Icon, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-slate-100 p-6">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Icon size={18} />
        </span>
        <div>
          <h2 className="font-semibold text-slate-800">{title}</h2>
          <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-[#5268d8]" : "bg-slate-200"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <span className="flex items-center gap-2.5 text-xs text-slate-500">
        <Icon size={15} className="text-slate-400" />
        {label}
      </span>
      <span className="text-right text-xs font-semibold text-slate-700">
        {children}
      </span>
    </div>
  );
}

export default function Settings() {
  const [activeMenu, setActiveMenu] = useState("Settings");
  const auth = useAuth();
  const { user, token, logout } = auth;
  const navigate = useNavigate();

  const [state, setState] = useState({ data: null, loading: true, error: "" });

  // Form values
  const [name, setName] = useState("");
  const [notifications, setNotifications] = useState(null);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [toast, setToast] = useState(null); // { type: "success" | "error", text }

  const handleMenuClick = (item) => {
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
    const path = routes[item.name];
    if (path) {
      setActiveMenu(item.name);
      navigate(path);
    }
  };

  const showToast = (type, text) => {
    setToast({ type, text });
  };

  // Hide the message after 4 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Load settings
  useEffect(() => {
    let cancelled = false;

    adminService
      .getSettings(token)
      .then((data) => {
        if (cancelled) return;
        setState({ data, loading: false, error: "" });
        setName(data.name || "");
        setNotifications(data.notifications);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Settings load failed:", err);
        setState({
          data: null,
          loading: false,
          error: err.message || "Could not load settings.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const { data, loading, error } = state;

  const nameChanged = data && name.trim() !== (data.name || "");
  const notificationsChanged =
    data &&
    notifications &&
    NOTIFICATION_ITEMS.some(
      ({ key }) => notifications[key] !== data.notifications[key]
    );

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const trimmed = name.trim().replace(/\s+/g, " ");

    if (trimmed.length < 2) {
      showToast("error", "Name must be at least 2 characters.");
      return;
    }

    setSavingProfile(true);
    try {
      const updated = await adminService.updateProfile(trimmed, token);
      setState((s) => ({ ...s, data: updated }));
      setName(updated.name);
      // If your AuthContext has an update function, the topbar changes at once.
      auth.updateUser?.({ name: updated.name });
      showToast("success", "Profile updated.");
    } catch (err) {
      showToast("error", err.message || "Could not update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSavingNotifications(true);
    try {
      const updated = await adminService.updateNotifications(
        notifications,
        token
      );
      setState((s) => ({ ...s, data: updated }));
      setNotifications(updated.notifications);
      showToast("success", "Notification preferences saved.");
    } catch (err) {
      showToast("error", err.message || "Could not save preferences.");
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login"); // change if your login route is different
  };

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-800">
      <AdminSidebar
        activeMenu={activeMenu}
        onMenuClick={handleMenuClick}
        adminName={user?.name || "System Admin"}
        onLogout={logout}
      />

      <div className="min-h-screen lg:ml-[288px]">
        <AdminTopbar user={user} activeMenu={activeMenu} />

        <main className="space-y-6 p-5 md:p-8">
          {/* Title */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[2px] text-[#5268d8]">
              Account
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Settings
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Manage your profile, notifications and session.
            </p>
          </div>

          {/* Message */}
          {toast && (
            <div
              role="status"
              className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold ${
                toast.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              {toast.text}
            </div>
          )}

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-400">
              Loading settings...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-rose-500">
              {error}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {/* Profile */}
              <Card
                title="Profile"
                subtitle="Your name and sign-in email"
                icon={User}
              >
                <div className="mb-6 flex items-center gap-4">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f1e4d6] text-base font-bold text-slate-700">
                    {getInitials(data.name)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {data.name}
                    </p>
                    <p className="text-xs text-slate-400">Administrator</p>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div>
                    <label
                      htmlFor="admin-name"
                      className="mb-2 block text-xs font-semibold text-slate-600"
                    >
                      Full name
                    </label>
                    <input
                      id="admin-name"
                      type="text"
                      value={name}
                      maxLength={60}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-indigo-400"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="admin-email"
                      className="mb-2 block text-xs font-semibold text-slate-600"
                    >
                      Email address
                    </label>
                    <div className="relative">
                      <Mail
                        size={16}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        id="admin-email"
                        type="email"
                        value={data.email || ""}
                        disabled
                        readOnly
                        className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-sm text-slate-500"
                      />
                      <Lock
                        size={15}
                        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">
                      This email is used to sign in with a one-time code, so it
                      cannot be changed here.
                    </p>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setName(data.name || "")}
                      disabled={!nameChanged || savingProfile}
                      className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Reset
                    </button>
                    <button
                      type="submit"
                      disabled={!nameChanged || savingProfile}
                      className="rounded-lg bg-[#5268d8] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#4358c6] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingProfile ? "Saving..." : "Save changes"}
                    </button>
                  </div>
                </form>
              </Card>

              {/* Admin account */}
              <Card
                title="Admin account"
                subtitle="Details about your access"
                icon={ShieldCheck}
              >
                <div className="divide-y divide-slate-100">
                  <InfoRow icon={ShieldCheck} label="Role">
                    <span className="rounded-md bg-indigo-50 px-2 py-1 capitalize text-indigo-600">
                      {data.role || "admin"}
                    </span>
                  </InfoRow>
                  <InfoRow icon={CheckCircle2} label="Account status">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 ${
                        data.isActive
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-rose-50 text-rose-600"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          data.isActive ? "bg-emerald-500" : "bg-rose-500"
                        }`}
                      />
                      {data.isActive ? "Active" : "Inactive"}
                    </span>
                  </InfoRow>
                  <InfoRow icon={Building2} label="Institution">
                    {data.institution || "Not provided"}
                  </InfoRow>
                  <InfoRow icon={CalendarDays} label="Member since">
                    {formatDate(data.createdAt)}
                  </InfoRow>
                  <InfoRow icon={Lock} label="Sign-in method">
                    Email one-time code
                  </InfoRow>
                </div>
              </Card>

              {/* Notifications */}
              <Card
                title="Notifications"
                subtitle="Choose which emails you want to receive"
                icon={Bell}
              >
                <div className="divide-y divide-slate-100">
                  {NOTIFICATION_ITEMS.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between gap-4 py-4 first:pt-0"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {item.description}
                        </p>
                      </div>
                      <Toggle
                        label={item.title}
                        checked={!!notifications?.[item.key]}
                        onChange={(value) =>
                          setNotifications((n) => ({ ...n, [item.key]: value }))
                        }
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-2 flex justify-end">
                  <button
                    onClick={handleSaveNotifications}
                    disabled={!notificationsChanged || savingNotifications}
                    className="rounded-lg bg-[#5268d8] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#4358c6] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingNotifications ? "Saving..." : "Save preferences"}
                  </button>
                </div>
              </Card>

              {/* Session */}
              <Card
                title="Session"
                subtitle="Sign out of this device"
                icon={LogOut}
              >
                <p className="text-xs leading-relaxed text-slate-500">
                  You will need a new one-time code sent to{" "}
                  <span className="font-semibold text-slate-700">
                    {data.email}
                  </span>{" "}
                  the next time you sign in.
                </p>

                {!confirmLogout ? (
                  <button
                    onClick={() => setConfirmLogout(true)}
                    className="mt-5 inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-100"
                  >
                    <LogOut size={15} /> Log out
                  </button>
                ) : (
                  <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4">
                    <p className="text-xs font-semibold text-rose-700">
                      Are you sure you want to log out?
                    </p>
                    <div className="mt-3 flex gap-3">
                      <button
                        onClick={handleLogout}
                        className="rounded-lg bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-rose-700"
                      >
                        Yes, log out
                      </button>
                      <button
                        onClick={() => setConfirmLogout(false)}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            </div>
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