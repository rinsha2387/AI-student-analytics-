import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, X, CheckCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { adminService } from "../../services/adminService";

const readStorageKey = (userId) => `adminReadNotifications_${userId || "anon"}`;

const AdminTopbar = ({ user, activeMenu = "Dashboard" }) => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const adminName = user?.name || "System Admin";
  const adminId = user?._id || user?.id;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [preferences, setPreferences] = useState({
    analysisFailures: true,
    newUserRequests: true,
    systemAlerts: true,
    weeklySummary: false,
  });
  const [readIds, setReadIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(readStorageKey(adminId)) || "[]"));
    } catch {
      return new Set();
    }
  });

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  const persistRead = (ids) => {
    try {
      localStorage.setItem(readStorageKey(adminId), JSON.stringify([...ids]));
    } catch {
      // ignore storage errors
    }
  };

  const loadNotifications = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const items = [];

      // Pending user requests
      try {
        const users = await adminService.getUsers(token);
        (users?.users || [])
          .filter((u) => u.status === "pending" || u.isActive === false)
          .slice(0, 10)
          .forEach((u) => {
            items.push({
              id: `user-${u._id}`,
              title: "New user request",
              message: `${u.name || u.email} is waiting for approval.`,
              time: u.createdAt,
              type: "user",
              to: "/admin/management-users",
            });
          });
      } catch {
        // ignore
      }

      // Failed analyses
      try {
        const history = await adminService.getAnalysisHistory(
          { status: "failed", limit: 10 },
          token
        );
        (history?.analyses || []).forEach((a) => {
          items.push({
            id: `analysis-${a.id || a.analysisId}`,
            title: "Analysis failed",
            message: `${a.datasetName || "A dataset"} failed to analyze.`,
            time: a.createdAt,
            type: "analysis",
            to: "/admin/analysis-history",
          });
        });
      } catch {
        // ignore
      }

      // Recent system activity
      try {
        const logs = await adminService.getSystemLogs({ limit: 8 }, token);
        (logs?.logs || []).slice(0, 8).forEach((l) => {
          items.push({
            id: `log-${l.id}`,
            title: l.activity || "System activity",
            message: l.resource && l.resource !== "—" ? l.resource : "New system event recorded.",
            time: l.timestamp,
            type: "system",
            to: "/admin/system-logs",
          });
        });
      } catch {
        // ignore
      }

      // Sort newest first
      items.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));

      const filtered = items.filter((n) => {
        if (n.type === "user") return preferences.newUserRequests;
        if (n.type === "analysis") return preferences.analysisFailures;
        if (n.type === "system") return preferences.systemAlerts;
        return true;
      });

      setNotifications(filtered);
    } finally {
      setLoading(false);
    }
  }, [token, preferences]);

  useEffect(() => {
    if (!token) return;
    adminService
      .getSettings(token)
      .then((data) => {
        if (data?.notifications) setPreferences(data.notifications);
      })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    loadNotifications();
    const timer = setInterval(loadNotifications, 60000);
    return () => clearInterval(timer);
  }, [loadNotifications]);

  const markAsRead = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      persistRead(next);
      return next;
    });
  };

  const markAllAsRead = () => {
    setReadIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(n.id));
      persistRead(next);
      return next;
    });
    setNotifications([]);
  };

  const initials = adminName
    .split(" ")
    .map((name) => name.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const formatTime = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-[82px] items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 md:px-8">
        {/* Breadcrumb */}
        <div className="text-sm text-slate-400">
          Admin <span className="mx-2">›</span>
          <span className="font-semibold text-slate-800">{activeMenu}</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Notification bell */}
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              loadNotifications();
            }}
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-50"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-800">{adminName}</p>
            <p className="text-xs text-slate-400">Administrator</p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eadfce] text-sm font-semibold text-slate-800">
            {initials}
          </div>
        </div>
      </header>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
            <p className="text-xs text-slate-500">
              {unreadCount} unread
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={markAllAsRead}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
            >
              <CheckCheck size={14} />
              Mark all read
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-50"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Loading notifications...
            </p>
          ) : notifications.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No notifications yet.
            </p>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => {
                const isRead = readIds.has(n.id);
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      markAsRead(n.id);
                      if (n.to) navigate(n.to);
                      setOpen(false);
                    }}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      isRead
                        ? "border-slate-200 bg-white"
                        : "border-indigo-100 bg-indigo-50/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {n.title}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          {n.message}
                        </p>
                        <p className="mt-2 text-[11px] text-slate-400">
                          {formatTime(n.time)}
                        </p>
                      </div>
                      {!isRead && (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default AdminTopbar;