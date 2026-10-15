import React from "react";

const AdminTopbar = ({
  user,
  activeMenu = "Dashboard",
}) => {
  const adminName = user?.name || "System Admin";

  const initials = adminName
    .split(" ")
    .map((name) => name.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-[82px] items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 md:px-8">
      {/* Breadcrumb */}
      <div className="text-sm text-slate-400">
        Admin <span className="mx-2">›</span>
        <span className="font-semibold text-slate-800">
          {activeMenu}
        </span>
      </div>

      {/* Admin Profile */}
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-800">
            {adminName}
          </p>
          <p className="text-xs text-slate-400">
            Administrator
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eadfce] text-sm font-semibold text-slate-800">
          {initials}
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;