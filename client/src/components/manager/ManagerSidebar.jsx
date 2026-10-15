
import React from "react";

const ManagerSidebar = ({
  activeMenu,
  onMenuClick,
  managerName,
  institutionName,
  onLogout,
}) => {
  const menuGroups = [
    {
      title: "OVERVIEW",
      items: [
        { name: "Dashboard", icon: "dashboard" },
        { name: "Upload Data", icon: "upload" },
        { name: "AI Analysis", icon: "ai" },
      ],
    },
    {
      title: "ANALYTICS",
      items: [
        { name: "High-Risk Students", icon: "risk", badge: "87" },
        { name: "Student Insights", icon: "students" },
        { name: "Behavior Insights", icon: "behavior" },
        { name: "Academic Analytics", icon: "academic" },
        { name: "Attendance Analytics", icon: "attendance" },
        { name: "Financial Impact", icon: "financial" },
      ],
    },
    {
      title: "WORKSPACE",
      items: [
        { name: "Reports", icon: "reports" },
        { name: "Analysis History", icon: "history" },
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

      case "upload":
        return (
          <svg {...common}>
            <path d="M12 16V4" />
            <path d="M7 9l5-5 5 5" />
            <path d="M4 20h16" />
          </svg>
        );

      case "ai":
        return (
          <svg {...common}>
            <path d="M12 3l1.4 4.1L17.5 9l-4.1 1.4L12 14.5l-1.4-4.1L6.5 9l4.1-1.9L12 3z" />
            <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z" />
          </svg>
        );

      case "risk":
      case "alert":
        return (
          <svg {...common}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 16h.01" />
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

      case "behavior":
        return (
          <svg {...common}>
            <path d="M12 3a6 6 0 016 6c0 2.4-1.2 4-2.5 5.3-.9.9-1.5 1.8-1.5 3.7h-4c0-1.9-.6-2.8-1.5-3.7C7.2 13 6 11.4 6 9a6 6 0 016-6z" />
            <path d="M9 21h6M10 18h4" />
          </svg>
        );

      case "academic":
        return (
          <svg {...common}>
            <path d="M3 10l9-5 9 5-9 5-9-5z" />
            <path d="M7 12.5V17c2.7 2 7.3 2 10 0v-4.5" />
            <path d="M21 10v6" />
          </svg>
        );

      case "attendance":
      case "calendar":
        return (
          <svg {...common}>
            <rect x="3" y="4" width="18" height="17" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
            <path d="M8 14h2M14 14h2M8 17h2" />
          </svg>
        );

      case "financial":
        return (
          <svg {...common}>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 9h18M16 14h2" />
          </svg>
        );

      case "reports":
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

      case "settings":
        return (
          <svg {...common}>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V20h-2.5v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H6v-2.5h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.9l-.1-.1L9 6.7l.1.1a1.7 1.7 0 001.9.3 1.7 1.7 0 001-1.5V5h2.5v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 00.3 1.9 1.7 1.7 0 001.5 1h.1v2.5h-.1a1.7 1.7 0 00-1.5 1z" />
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

  const initials = managerName
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[288px] border-r border-[#e6e9f0] bg-white lg:block">
      {/* Logo */}
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

      {/* Institution */}
      <div className="px-5">
        <div className="flex w-full items-center justify-between rounded-xl border border-[#e5e8ef] bg-white px-3 py-3 text-left shadow-sm">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eef1ff] text-lg font-semibold text-[#5268d8]">
              {institutionName.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-[#1d3151]">
                {institutionName}
              </p>
              <p className="mt-0.5 text-[11px] text-[#91a0b7]">
                Management workspace
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Navigation — help card removed */}
      <nav className="mt-7 h-[calc(100vh-205px)] overflow-y-auto px-4 pb-4">
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
                    onClick={() => onMenuClick(item)}
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

                    {item.badge && (
                      <span className="rounded-md bg-[#fff0ef] px-2 py-0.5 text-[10px] font-semibold text-[#e66e67]">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Manager profile and logout */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-[#edf0f4] bg-white px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eee5d6] text-[12px] font-semibold text-[#765d3c]">
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold text-[#233858]">
              {managerName}
            </p>
            <p className="text-[11px] text-[#8b99ae]">Management</p>
          </div>

          <button
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

export default ManagerSidebar;
