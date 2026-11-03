import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
// Change this path to match where ManagerTopbar.jsx is saved.
// From client/src/components/manager/ it is "../../context/AuthContext".
import { useAuth } from "../../context/AuthContext";

const API_URL = "http://localhost:5000/api";

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

    case "checks":
      return (
        <svg {...commonProps}>
          <path d="m2 13 4 4L14 7" />
          <path d="m11 15 2 2L22 7" />
        </svg>
      );

    default:
      return null;
  }
};

const timeAgo = (value) => {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return "";

  const minutes = Math.floor((Date.now() - time) / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
};

const ManagerTopbar = ({
  managerName,
  search,
  setSearch,
  activeMenu = "Dashboard",
}) => {
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [open, setOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [readIds, setReadIds] = useState([]);
  const bellRef = useRef(null);

  const initials = managerName
    ? managerName
        .split(" ")
        .map((name) => name.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "M";

  // Read ids are remembered in this browser, one list per manager.
  const storageKey = `readJoinRequests:${user?.id || "manager"}`;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      setReadIds(Array.isArray(saved) ? saved : []);
    } catch {
      setReadIds([]);
    }
  }, [storageKey]);

  const saveReadIds = (ids) => {
    setReadIds(ids);

    try {
      localStorage.setItem(storageKey, JSON.stringify(ids));
    } catch {
      // ignore storage errors
    }
  };

  // Load people waiting to join (now, and again every 30 seconds).
  const loadRequests = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/team`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setRequests(Array.isArray(data.pending) ? data.pending : []);
      }
    } catch {
      // ignore network errors; try again on the next refresh
    }
  }, [token]);

  useEffect(() => {
    loadRequests();

    const timer = setInterval(loadRequests, 30000);
    window.addEventListener("focus", loadRequests);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", loadRequests);
    };
  }, [loadRequests]);

  // Close the panel when clicking outside it or pressing Escape.
  useEffect(() => {
    if (!open) return;

    const handleClick = (event) => {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const unreadCount = requests.filter((item) => !readIds.includes(item._id))
    .length;

  const markAllRead = () => {
    saveReadIds(Array.from(new Set([...readIds, ...requests.map((r) => r._id)])));
  };

  const openRequest = (request) => {
    if (!readIds.includes(request._id)) {
      saveReadIds([...readIds, request._id]);
    }

    setOpen(false);
    navigate("/manager/team");
  };

  return (
    <header className="sticky top-0 z-30 flex h-[84px] items-center justify-between border-b border-[#e6e9f0] bg-white px-6 lg:px-11">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <span className="text-[13px] text-[#91a0b7]">Management</span>

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
        <div
          ref={bellRef}
          className="relative hidden border-l border-[#e7eaf0] pl-4 sm:block"
        >
          <button
            type="button"
            aria-label="Notifications"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="relative block rounded-lg p-1 text-[#71829d] hover:text-[#4d62d6]"
          >
            <Icon type="bell" size={21} />

            {unreadCount > 0 && (
              <span className="absolute right-0.5 top-0 h-2 w-2 rounded-full bg-[#e86b69]" />
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-[calc(100%+18px)] z-40 w-[400px] max-w-[92vw] overflow-hidden rounded-2xl border border-[#e6e9f0] bg-white shadow-[0_18px_45px_rgba(27,49,84,0.12)]">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5">
                <h3 className="text-[17px] font-semibold text-[#1b2347]">
                  Notifications
                </h3>

                <button
                  type="button"
                  onClick={markAllRead}
                  disabled={unreadCount === 0}
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#4d62d6] hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:no-underline"
                >
                  <Icon type="checks" size={16} />
                  Mark read
                </button>
              </div>

              {/* List */}
              <div className="max-h-[360px] overflow-y-auto border-t border-[#eceff5]">
                {requests.length === 0 ? (
                  <p className="px-6 py-10 text-center text-[13px] text-[#8a97ad]">
                    You're all caught up. New join requests will appear here.
                  </p>
                ) : (
                  requests.map((request) => {
                    const isUnread = !readIds.includes(request._id);

                    return (
                      <button
                        key={request._id}
                        type="button"
                        onClick={() => openRequest(request)}
                        className="flex w-full items-start gap-4 border-b border-[#eceff5] px-6 py-4 text-left last:border-b-0 hover:bg-[#f8f9fd]"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef0fc] text-[#5269d6]">
                          <Icon type="bell" size={18} />
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-[14px] font-semibold text-[#1b2347]">
                              {request.name} wants to join
                            </span>

                            {isUnread && (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-[#e86b69]" />
                            )}
                          </span>

                          <span className="mt-1 block truncate text-[13px] text-[#6c7a91]">
                            {request.email} is waiting for your approval.
                          </span>

                          <span className="mt-1.5 block text-[12px] text-[#a0abbd]">
                            {timeAgo(request.createdAt)}
                          </span>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              {requests.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    navigate("/manager/team");
                  }}
                  className="w-full border-t border-[#eceff5] px-6 py-3.5 text-center text-[13px] font-semibold text-[#4d62d6] hover:bg-[#f8f9fd]"
                >
                  Review in Team access
                </button>
              )}
            </div>
          )}
        </div>

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