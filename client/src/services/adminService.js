const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

async function getSection(path, token, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || `Request failed (${response.status})`);
  }

  return result.data ?? result;
}

export const adminService = {
  getDashboard: (token) => getSection("/admin/dashboard", token),

  // Management Users page.
  getUsers: (token) => getSection("/admin/users", token),

  getAnalysisHistory: (params, token) => {
    const query = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== "" && value != null) query.set(key, value);
    });
    return getSection(`/admin/analysis-history?${query.toString()}`, token);
  },

  getSystemLogs: (params, token) => {
    const query = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== "" && value != null) query.set(key, value);
    });
    return getSection(`/admin/system-logs?${query.toString()}`, token);
  },

  getSettings: (token) => getSection("/admin/settings", token),

  updateProfile: (name, token) =>
    getSection("/admin/settings/profile", token, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    }),

  updateNotifications: (notifications, token) =>
    getSection("/admin/settings/notifications", token, {
      method: "PATCH",
      body: JSON.stringify({ notifications }),
    }),

  updateUserStatus: (id, isActive, token) =>
    getSection(`/admin/users/${id}/status`, token, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    }),
};
