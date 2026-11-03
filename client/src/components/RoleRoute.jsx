import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const homeFor = (role) => {
  if (role === "sales") return "/sales/financial-impact";
  if (role === "admin") return "/admin/dashboard";
  return "/manager/dashboard";
};

export default function RoleRoute({ role, children }) {
  const { token, user } = useAuth();

  if (!token) return <Navigate to="/login" replace />;

  // Wrong side: send the person to their own side.
  // (When a manager changes a role, the user moves automatically.)
  if (user?.role !== role) {
    return <Navigate to={homeFor(user?.role)} replace />;
  }

  return children;
}