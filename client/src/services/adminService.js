
const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

async function getSection(path, token) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}): ${path}`);
  }

  const result = await response.json();

  // Supports either { data: ... } or a direct JSON response.
  return result.data ?? result;
}

export const adminService = {
  getStats: (token) =>
    getSection("/admin/dashboard/stats", token),

  getUsage: (token) =>
    getSection("/admin/dashboard/usage", token),

  getHealth: (token) =>
    getSection("/admin/dashboard/health", token),

  getActivity: (token) =>
    getSection("/admin/dashboard/activity", token),
};
