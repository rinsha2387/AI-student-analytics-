import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import WaitingApproval from "./pages/WaitingApproval";
import ManagerDashboard from "./pages/manager/Dashboard";
import AdminDashboard from "./pages/admin/Dashboard";
import UploadDataset from "./pages/manager/uploadDataset";
import ManagerLayout from "./components/manager/ManagerLayout";
import ManagementUsers from "./pages/admin/MangmentUsers";
import AIPrompts from "./pages/admin/AIPrompts";
import AIConfiguration from "./pages/admin/AIConfiguration";
import AnalysisConfiguration from "./pages/admin/AnalysisConfiguration";
import AIAnalysis from "./pages/manager/AIAnalysis";
import StudentInsights from "./pages/manager/StudentInsight";
import AttendanceAnalytics from "./pages/manager/AttendanceAnalytics";
import TeamManagement from "./pages/manager/TeamManagment";
import RoleRoute from "./components/RoleRoute";
import SalesLayout from "./components/sales/SalesLayout";
import SalesDashboard from "./pages/sales/SalesDashboard";

import ProtectedRoute from "./components/common/ProtectedRoute";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { getHomePath } from "./utils/roleHome";

// Sends each person to the right place (login, waiting page,
// admin, manager or sales dashboard).
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

  return <Navigate to={getHomePath(user)} replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Normal waiting page for people the manager has not accepted yet */}
          <Route path="/waiting-approval" element={<WaitingApproval />} />

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
            <Route path="ai-analysis" element={<AIAnalysis />} />
            <Route path="ai-analysis/:datasetId" element={<AIAnalysis />} />
            <Route path="student-insights" element={<StudentInsights />} />
            <Route path="student-insights/:datasetId" element={<StudentInsights />} />
            <Route path="attendance-analytics" element={<AttendanceAnalytics />} />
            <Route path="attendance-analytics/:datasetId" element={<AttendanceAnalytics />} />
            <Route path="team" element={<TeamManagement />} />
          </Route>

          {/* Sales routes (only for accepted sales people) */}
          <Route
            path="/sales"
            element={
              <RoleRoute role="sales">
                <SalesLayout />
              </RoleRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<SalesDashboard />} />
            {/* Replace these with your own sales pages when they are ready */}
            <Route path="financial-impact" element={<SalesDashboard />} />
            <Route path="fees-due" element={<SalesDashboard />} />
            <Route path="fees-paid" element={<SalesDashboard />} />
          </Route>

          {/* Admin routes */}
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