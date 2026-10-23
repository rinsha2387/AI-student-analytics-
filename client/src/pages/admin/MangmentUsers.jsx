import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminTopbar from "../../components/admin/AdminTopbar";
import { adminService } from "../../services/adminService";

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function formatLastLogin(value) {
  if (!value) return "Not recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not recorded";

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function StatCard({ icon, value, title, subtitle, color }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-xl ${color}`}>
        {icon}
      </div>

      <p className="text-2xl font-bold tracking-tight text-[#1b3154]">
        {value}
      </p>

      <h2 className="mt-1 text-sm font-semibold text-slate-700">
        {title}
      </h2>

      <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
    </article>
  );
}

export default function ManagementUsers() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();

  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await adminService.getUsers(token);

      setUsers(Array.isArray(result.users) ? result.users : []);
      setStats(result.stats || null);
    } catch (err) {
      console.error("Could not load management users:", err);
      setError(err.message || "Could not load users.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return users;

    return users.filter((item) =>
      [
        item.name,
        item.email,
        item.institution,
        item.role,
        item.isActive ? "active" : "disabled",
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [users, search]);

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

    if (routes[name]) navigate(routes[name]);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleToggleStatus = async (item) => {
    const nextStatus = !item.isActive;

    const confirmed = window.confirm(
      `${nextStatus ? "Activate" : "Disable"} ${item.name}'s account?`
    );

    if (!confirmed) return;

    setUpdatingId(item._id);
    setActionMessage("");
    setError("");

    try {
      await adminService.updateUserStatus(item._id, nextStatus, token);

      setActionMessage(
        `${item.name}'s account is now ${nextStatus ? "active" : "disabled"}.`
      );

      await loadUsers();
    } catch (err) {
      setError(err.message || "Could not update this account.");
    } finally {
      setUpdatingId("");
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-800">
      <AdminSidebar
        activeMenu="Management Users"
        adminName={user?.name || "System Admin"}
        onMenuClick={handleMenuClick}
        onLogout={handleLogout}
      />

      <div className="min-h-screen lg:ml-[288px]">
        <AdminTopbar
          user={user}
          activeMenu="Management Users"
        />

        <main className="space-y-6 p-5 md:p-8">
          {/* Page heading */}
          <section className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#5268d8]">
                Administration
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1b3154]">
                Management users
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Manage the people who can access student analytics.
              </p>
            </div>

            <button
              type="button"
              onClick={loadUsers}
              disabled={loading}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "↻ Refresh"}
            </button>
          </section>

          {/* Real database statistics */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              icon="♙"
              value={stats ? formatNumber(stats.totalUsers) : "—"}
              title="Total users"
              subtitle="Across all accounts"
              color="bg-indigo-50 text-indigo-600"
            />

            <StatCard
              icon="✓"
              value={stats ? formatNumber(stats.activeUsers) : "—"}
              title="Active users"
              subtitle="Currently enabled"
              color="bg-emerald-50 text-emerald-600"
            />

            <StatCard
              icon="♢"
              value={stats ? formatNumber(stats.adminAccounts) : "—"}
              title="Admin accounts"
              subtitle="With system access"
              color="bg-violet-50 text-violet-600"
            />
          </section>

          {/* User directory */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-[#1b3154]">
                  User directory
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Access and activity for management accounts
                </p>
              </div>

              <div className="w-full sm:max-w-xs">
                <label htmlFor="user-search" className="sr-only">
                  Search users
                </label>

                <input
                  id="user-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, email, institution..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            {error && (
              <div className="m-5 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={loadUsers}
                  className="mt-2 font-semibold underline"
                >
                  Try again
                </button>
              </div>
            )}

            {actionMessage && !error && (
              <p className="mx-5 mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
                {actionMessage}
              </p>
            )}

            {loading ? (
              <div className="flex min-h-48 items-center justify-center text-sm text-slate-400">
                Loading users from the database...
              </div>
            ) : !error && filteredUsers.length === 0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center px-6 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-xl text-indigo-500">
                  ♙
                </div>
                <p className="font-semibold text-slate-700">
                  {users.length === 0 ? "No users found" : "No matching users"}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {users.length === 0
                    ? "User accounts will appear here when they exist in MongoDB."
                    : "Try another name, email, institution, or status."}
                </p>
              </div>
            ) : !error ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left">
                  <thead className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Institution</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Last login</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((item, index) => {
                      const initials = (item.name || "?")
                        .trim()
                        .split(/\s+/)
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();

                      return (
                        <tr
                          key={item._id}
                          className="transition hover:bg-slate-50/70"
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                                  index % 2 === 0
                                    ? "bg-violet-100 text-violet-600"
                                    : "bg-teal-50 text-teal-600"
                                }`}
                              >
                                {initials}
                              </div>

                              <div className="min-w-0">
                                <p className="font-semibold text-slate-800">
                                  {item.name || "Unnamed user"}
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                  {item.email}
                                </p>
                                <p className="mt-1 text-[10px] capitalize text-slate-400">
                                  {item.role}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5 text-sm text-slate-600">
                            {item.institution || "Not provided"}
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={`inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] font-semibold ${
                                item.isActive
                                  ? "bg-emerald-50 text-emerald-600"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  item.isActive
                                    ? "bg-emerald-500"
                                    : "bg-slate-400"
                                }`}
                              />
                              {item.isActive ? "Active" : "Disabled"}
                            </span>
                          </td>

                          <td className="px-6 py-5 text-sm text-slate-500">
                            {formatLastLogin(item.lastLogin)}
                          </td>

                          <td className="px-6 py-5 text-right">
                            <button
                              type="button"
                              disabled={updatingId === item._id}
                              onClick={() => handleToggleStatus(item)}
                              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:cursor-wait disabled:opacity-50"
                            >
                              {updatingId === item._id
                                ? "Updating..."
                                : item.isActive
                                  ? "Disable"
                                  : "Activate"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}

            {!loading && !error && users.length > 0 && (
              <div className="border-t border-slate-100 px-6 py-4 text-xs text-slate-400">
                Showing {filteredUsers.length} of {users.length} users
              </div>
            )}
          </section>

          <footer className="flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-5 text-[11px] text-slate-400">
            <span>© {new Date().getFullYear()} AI Student Analytics</span>
            <span>Insights support human judgment</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
