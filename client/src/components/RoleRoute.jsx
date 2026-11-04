import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getHomePath } from "../utils/roleHome";

export default function RoleRoute({ role, children }) {
  const { token, user, loading } = useAuth();

  // Wait until the saved login is loaded (needed after a page refresh).
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    );
  }

  if (!token || !user) return <Navigate to="/login" replace />;

  // Waiting people go to the waiting page.
  // Wrong side: go to your own home page.
  if (user.status === "pending" || user.role !== role) {
    return <Navigate to={getHomePath(user)} replace />;
  }

  return children;
}