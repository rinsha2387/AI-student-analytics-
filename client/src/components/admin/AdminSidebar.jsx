import React from "react";

const AdminSidebar = ({
  activeMenu = "Dashboard",
  onMenuClick,
  adminName = "System Admin",
  onLogout,
}) => {
  const menuGroups = [
    {
      title: "OVERVIEW",
      items: [
        { name: "Dashboard", icon: "dashboard" },
        { name: "Management Users", icon: "students" },
        { name: "Student Data", icon: "reports" },
      ],
    },
    {
      title: "AI & CONFIGURATION",
      items: [
        { name: "AI Prompts", icon: "ai" },
        { name: "AI Configuration", icon: "settings" },
        { name: "Analysis Configuration", icon: "configuration" },
        { name: "Processing Monitor", icon: "activity" },
      ],
    },
    {
      title: "SYSTEM",
      items: [
        { name: "Reports", icon: "reports" },
        { name: "Analysis History", icon: "history" },
        { name: "System Logs", icon: "logs" },
        { name: "Settings", icon: "settings" },
      ],
    },
  ];

  const Icon = ({ type, size = 20 }) => {
    const common = {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.8,
      strokeLinecap: "round",
      strokeLinejoin: "round",
    };

    switch (type) {
      case "dashboard":
        return (
          <svg {...common}>
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        );

      case "students":
        return (
          <svg {...common}>
            <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
        );

      case "ai":
        return (
          <svg {...common}>
            <path d="M12 3l1.4 4.1L17.5 9l-4.1 1.4L12 14.5l-1.4-4.1L6.5 9l4.1-1.9L12 3z" />
            <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z" />
          </svg>
        );

      case "settings":
      case "configuration":
        return (
          <svg {...common}>
            <path d="M4 6h16M4 12h16M4 18h16" />
            <circle cx="9" cy="6" r="2" fill="white" />
            <circle cx="15" cy="12" r="2" fill="white" />
            <circle cx="8" cy="18" r="2" fill="white" />
          </svg>
        );

      case "activity":
        return (
          <svg {...common}>
            <path d="M3 12h4l3-8 4 16 3-8h4" />
          </svg>
        );

      case "reports":
      case "logs":
        return (
          <svg {...common}>
            <path d="M6 3h9l3 3v15H6z" />
            <path d="M14 3v4h4M9 12h6M9 16h6" />
          </svg>
        );

      case "history":
        return (
          <svg {...common}>
            <path d="M3 12a9 9 0 109-9 9.3 9.3 0 00-6.4 2.6L3 8" />
            <path d="M3 3v5h5M12 7v5l3 2" />
          </svg>
        );

      case "down":
        return (
          <svg {...common}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        );

      default:
        return null;
    }
  };

  const initials =
    adminName
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "SA";

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[288px] border-r border-[#e6e9f0] bg-white lg:block">
       <div className="flex h-[96px] items-center px-7">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#5268d8] text-white shadow-sm">
            <Icon type="academic" size={23} />
          </div>

          <div>
            <h1 className="text-[23px] font-bold tracking-[-0.8px] text-[#1b3154]">
              AI<span className="text-[#5268d8]">Student</span>
            </h1>
            <p className="mt-[-2px] text-[8px] font-semibold tracking-[2px] text-[#8492aa]">
               ANALYTICS
            </p>
          </div>
        </div>
      </div>

      {/* Admin navigation — no institution selector */}
      <nav className="mt-7 h-[calc(100vh-165px)] overflow-y-auto px-4 pb-4">
        {menuGroups.map((group) => (
          <div key={group.title} className="mb-7">
            <p className="mb-3 px-3 text-[10px] font-semibold tracking-[1.4px] text-[#94a0b4]">
              {group.title}
            </p>

            <div className="space-y-1">
              {group.items.map((item) => {
                const active = activeMenu === item.name;

                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => onMenuClick?.(item)}
                    className={`group flex w-full items-center justify-between rounded-lg px-3 py-3 text-left transition ${
                      active
                        ? "bg-[#eef0ff] text-[#5268d8]"
                        : "text-[#566a89] hover:bg-[#f6f7fb] hover:text-[#5268d8]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon type={item.icon} size={20} />
                      <span className="text-[13px] font-medium">
                        {item.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Admin profile — no help card */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-[#edf0f4] bg-white px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eee5d6] text-[12px] font-semibold text-[#765d3c]">
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold text-[#233858]">
              {adminName}
            </p>
            <p className="text-[11px] text-[#8b99ae]">Administrator</p>
          </div>

          <button
            type="button"
            onClick={onLogout}
            title="Logout"
            aria-label="Logout"
            className="text-[#8d9bb0] hover:text-red-500"
          >
            •••
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;

