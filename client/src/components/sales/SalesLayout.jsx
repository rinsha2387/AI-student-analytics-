import { NavLink, Outlet } from "react-router-dom";
import { Banknote, Receipt, Wallet, LogOut, Lock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import WaitingApproval from "../../pages/sales/WaitingApproval";

const NAV_ITEMS = [
  { to: "/sales/financial-impact", label: "Financial Impact", icon: Banknote },
  { to: "/sales/fees-due", label: "Fees Due", icon: Receipt },
  { to: "/sales/fees-paid", label: "Fees Paid", icon: Wallet },
];

export default function SalesLayout() {
  const { user, logout } = useAuth();

  // Until the manager accepts, show only the waiting screen.
  const isPending = user?.status === "pending";

  const initials = String(user?.name || "")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white px-4 py-6 lg:block">
        <div className="mb-8 px-2">
          <p className="text-lg font-bold tracking-tight text-[#16244d]">
            AI Student<span className="text-[#5269d6]">Analytics</span>
          </p>
          <p className="text-[10px] uppercase tracking-[2px] text-slate-400">
            Sales workspace
          </p>
        </div>

        <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Finance
        </p>

        <nav className="space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) =>
            isPending ? (
              <div
                key={to}
                className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300"
              >
                <Icon size={18} />
                {label}
                <Lock size={13} className="ml-auto" />
              </div>
            ) : (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-slate-600 hover:bg-slate-50"
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ),
          )}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
          <p className="text-sm text-slate-500">
            {user?.institution?.name}
            {isPending && (
              <span className="ml-3 rounded-md bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-600">
                Pending approval
              </span>
            )}
          </p>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600">
              {initials}
            </div>
            <span className="hidden text-sm font-semibold text-slate-800 sm:block">
              {user?.name}
            </span>
            <button
              type="button"
              onClick={logout}
              title="Sign out"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-50"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {isPending ? <WaitingApproval /> : <Outlet />}
      </div>
    </div>
  );
}