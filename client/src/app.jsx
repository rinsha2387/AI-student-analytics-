import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";

import ProtectedRoute from "./components/common/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* ==============================
              Authentication Pages
          ============================== */}

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          {/* ==============================
              Manager Dashboard
          ============================== */}

          <Route
            path="/manager/dashboard"
            element={
              <ProtectedRoute allowedRoles={["manager"]}>
                <h1>Manager Dashboard</h1>
              </ProtectedRoute>
            }
          />

          {/* ==============================
              Admin Dashboard
          ============================== */}

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <h1>Admin Dashboard</h1>
              </ProtectedRoute>
            }
          />

          {/* ==============================
              Default Route
          ============================== */}

          <Route
            path="*"
            element={
              <Navigate
                to="/login"
                replace
              />
            }
          />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;