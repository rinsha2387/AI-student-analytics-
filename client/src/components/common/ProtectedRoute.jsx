import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check the user's role
  if (
    allowedRoles &&
    !allowedRoles.includes(user.role)
  ) {
    console.error(
      "Protected route role mismatch:",
      {
        currentRole: user.role,
        allowedRoles,
      }
    );

    if (user.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }

    if (user.role === "manager") {
      return <Navigate to="/manager/dashboard" replace />;
    }

    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
