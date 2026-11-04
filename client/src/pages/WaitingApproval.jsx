import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Clock, RefreshCw } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getHomePath } from "../utils/roleHome";

// Normal full-screen waiting page (no sidebar, not part of the sales section).
export default function WaitingApproval() {
  const { user, token, loading, refreshUser, logout } = useAuth();
  const [checking, setChecking] = useState(false);

  // Ask the server for the current status every 5 seconds
  // and when the person comes back to this tab.
  useEffect(() => {
    if (!token) return;

    const timer = setInterval(refreshUser, 5000);
    window.addEventListener("focus", refreshUser);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refreshUser);
    };
  }, [token, refreshUser]);

  const checkNow = async () => {
    setChecking(true);
    await refreshUser();
    setChecking(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    );
  }

  if (!token || !user) return <Navigate to="/login" replace />;

  // Accepted by the manager:
  //   chosen "Sales team" -> /sales/dashboard
  //   chosen "Manager"    -> /manager/dashboard
  if (user.status !== "pending") {
    return <Navigate to={getHomePath(user)} replace />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f8fd] px-5 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
          <Clock size={26} />
        </div>

        <h1 className="mt-5 text-xl font-semibold text-slate-900">
          Waiting for manager approval
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Your request to join{" "}
          <strong className="font-semibold text-slate-700">
            {user.institution?.name || "your institution"}
          </strong>{" "}
          was sent to the manager. When it is accepted, this page will open
          your dashboard automatically.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={checkNow}
            disabled={checking}
            className="inline-flex items-center gap-2 rounded-lg bg-[#5269d6] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#465dc8] disabled:opacity-60"
          >
            <RefreshCw size={15} className={checking ? "animate-spin" : ""} />
            Check now
          </button>

          <button
            type="button"
            onClick={logout}
            className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      </div>
    </main>
  );
}