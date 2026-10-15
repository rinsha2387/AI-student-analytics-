import React from "react";

const ManagerTopbar = ({
  managerName,
  search,
  setSearch,
  activeMenu = "Dashboard",
}) => {
  const initials = managerName
    ? managerName
        .split(" ")
        .map((name) => name.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "M";

  // Small icons used by the topbar
  const Icon = ({ type, size = 18 }) => {
    const commonProps = {
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
      case "chevron":
        return (
          <svg {...commonProps}>
            <path d="m9 18 6-6-6-6" />
          </svg>
        );

      case "search":
        return (
          <svg {...commonProps}>
            <circle cx="11" cy="11" r="7" />
            <path d="m16 16 4 4" />
          </svg>
        );

      case "bell":
        return (
          <svg {...commonProps}>
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M10 21h4" />
          </svg>
        );

      case "down":
        return (
          <svg {...commonProps}>
            <path d="m7 10 5 5 5-5" />
          </svg>
        );

      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-[84px] items-center justify-between border-b border-[#e6e9f0] bg-white px-6 lg:px-11">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <span className="text-[13px] text-[#91a0b7]">
          Management
        </span>

        <Icon type="chevron" size={15} />

        <span className="text-[13px] font-semibold text-[#1b3154]">
          {activeMenu}
        </span>
      </div>

      {/* Header right */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="hidden items-center rounded-xl border border-[#e2e6ee] bg-white px-3 md:flex">
          <Icon type="search" size={19} />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search anything..."
            className="h-10 w-[190px] bg-transparent px-2 text-[12px] outline-none placeholder:text-[#9aa6b8]"
          />

          <span className="rounded-md border border-[#e2e6ee] px-2 py-1 text-[10px] text-[#9aa6b8]">
            ⌘ K
          </span>
        </div>

        {/* Notification */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative hidden border-l border-[#e7eaf0] pl-4 text-[#71829d] sm:block"
        >
          <Icon type="bell" size={21} />
          <span className="absolute right-0 top-[-2px] h-1.5 w-1.5 rounded-full bg-[#e86b69]" />
        </button>

        {/* Profile */}
        <div className="flex items-center gap-3 border-l border-[#e7eaf0] pl-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eee5d6] text-[12px] font-semibold text-[#765d3c]">
            {initials}
          </div>

          <div className="hidden sm:block">
            <p className="text-[12px] font-semibold text-[#253957]">
              {managerName || "Manager"}
            </p>
          </div>

          <Icon type="down" size={15} />
        </div>
      </div>
    </header>
  );
};

export default ManagerTopbar;