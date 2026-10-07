import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Authentication */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Temporary dashboard routes */}
        <Route
          path="/manager/dashboard"
          element={<h1>Manager Dashboard</h1>}
        />

        <Route
          path="/admin/dashboard"
          element={<h1>Admin Dashboard</h1>}
        />

        {/* Default */}
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;