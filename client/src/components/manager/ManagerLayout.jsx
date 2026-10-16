
import React, { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import ManagerSidebar from "./ManagerSidebar";
import ManagerTopbar from "./ManagerTopbar";
import ManagerFooter from "./ManagerFooter";

const ManagerLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [search, setSearch] = useState("");

  const managerName = user?.name || "Manager";
  const institutionName =
    user?.institutionName ||
    user?.institution?.name ||
    "Your Institution";

  const routes = {
    Dashboard: "/manager/dashboard",
    "Upload Data": "/manager/upload-data",
    "AI Analysis": "/manager/ai-analysis",
    "High-Risk Students": "/manager/high-risk-students",
    "Student Insights": "/manager/student-insights",
    "Behavior Insights": "/manager/behavior-insights",
    "Academic Analytics": "/manager/academic-analytics",
    "Attendance Analytics": "/manager/attendance-analytics",
    "Financial Impact": "/manager/financial-impact",
    Reports: "/manager/reports",
    "Analysis History": "/manager/analysis-history",
    Settings: "/manager/settings",
  };

  const activeMenu =
    Object.keys(routes).find(
      (name) => routes[name] === location.pathname
    ) || "Dashboard";

  const handleMenuClick = (item) => {
    const name = typeof item === "string" ? item : item.name;
    const path = routes[name];

    if (path) navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-[#172b4d]">
      <ManagerSidebar
        activeMenu={activeMenu}
        onMenuClick={handleMenuClick}
        managerName={managerName}
        institutionName={institutionName}
        onLogout={handleLogout}
      />

      <div className="lg:ml-[288px] flex min-h-screen flex-col">
        <ManagerTopbar
          managerName={managerName}
          search={search}
          setSearch={setSearch}
          activeMenu={activeMenu}
        />

        <main className="flex-1">
          <Outlet />
        </main>

        <ManagerFooter institutionName={institutionName} />
      </div>
    </div>
  );
};

export default ManagerLayout;
