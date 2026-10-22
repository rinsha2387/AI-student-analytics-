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
  // Keep these existing dashboard methods.
  getStats: (token) =>
    getSection("/admin/dashboard/stats", token),

  getUsage: (token) =>
    getSection("/admin/dashboard/usage", token),

  getHealth: (token) =>
    getSection("/admin/dashboard/health", token),

  getActivity: (token) =>
    getSection("/admin/dashboard/activity", token),

  // Management Users page.
  getUsers: (token) =>
    getSection("/admin/users", token),

  updateUserStatus: (id, isActive, token) =>
    getSection(`/admin/users/${id}/status`, token, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    }),
};

