import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ManagerDashboard from "./pages/manager/Dashboard";
import AdminDashboard from "./pages/admin/Dashboard";
import UploadDataset from "./pages/manager/uploadDataset";
import ManagerLayout from "./components/manager/ManagerLayout";
import ManagementUsers from "./pages/admin/MangmentUsers";
import AIPrompts from "./pages/admin/AIPrompts";
import AIConfiguration from "./pages/admin/AIConfiguration";
import AnalysisConfiguration from "./pages/admin/AnalysisConfiguration";


import ProtectedRoute from "./components/common/ProtectedRoute";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Sends unmatched URLs to the home page of the signed-in user
// instead of sending everyone to the login screen.
const RoleHomeRedirect = () => {
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

  if (user.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (user.role === "manager") {
    return <Navigate to="/manager/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Manager routes */}
          <Route
            path="/manager"
            element={
              <ProtectedRoute allowedRoles={["manager"]}>
                <ManagerLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<ManagerDashboard />} />

            <Route path="upload-data" element={<UploadDataset />} />
          </Route>

          {/* Admin route */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/management-users"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <ManagementUsers />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/ai-prompts"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AIPrompts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/ai-config"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AIConfiguration />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analysis-configuration"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AnalysisConfiguration />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<RoleHomeRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
