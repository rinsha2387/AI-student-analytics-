import { useCallback, useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const API_URL = "http://localhost:5000/api";

export default function TeamManagement() {
  const { token } = useAuth();

  const [members, setMembers] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState(null);

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const loadTeam = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/team`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not load your team.");
      }

      setMembers(data.members);
      setPending(data.pending);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const changeRole = async (member, role) => {
    if (role === member.role) return;

    setBusyId(member._id);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`${API_URL}/team/${member._id}/role`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ role }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not change the role.");
      }

      setMembers((list) =>
        list.map((item) =>
          item._id === member._id ? { ...item, role: data.member.role } : item,
        ),
      );
      setNotice(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const reviewRequest = async (person, action, role) => {
    setBusyId(person._id);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`${API_URL}/team/${person._id}/status`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ action, role }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not update the request.");
      }

      setNotice(data.message);
      await loadTeam();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#fafafc] px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1100px]">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Team access
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Approve people who want to join your institution and choose their
          side. Managers see the dashboard, risk students and actions. Sales
          team members see only financial impact, fees due and fees pending.
        </p>

        {error && (
          <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {notice && (
          <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {notice}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <LoaderCircle className="animate-spin text-indigo-600" />
          </div>
        ) : (
          <>
            {/* Pending requests */}
            <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between px-7 py-5">
                <h2 className="text-lg font-semibold text-slate-900">
                  Join requests
                </h2>
                <span className="rounded-md bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600">
                  {pending.length} waiting
                </span>
              </div>

              {pending.length === 0 ? (
                <p className="border-t border-slate-100 px-7 py-8 text-center text-sm text-slate-500">
                  No one is waiting for approval.
                </p>
              ) : (
                pending.map((person) => (
                  <div
                    key={person._id}
                    className="flex flex-col gap-3 border-t border-slate-100 px-7 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {person.name}
                      </p>
                      <p className="text-xs text-slate-500">{person.email}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={busyId === person._id}
                        onClick={() => reviewRequest(person, "approve", "sales")}
                        className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                      >
                        Approve as Sales team
                      </button>

                      <button
                        type="button"
                        disabled={busyId === person._id}
                        onClick={() => reviewRequest(person, "approve", "manager")}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        Approve as Manager
                      </button>

                      <button
                        type="button"
                        disabled={busyId === person._id}
                        onClick={() => reviewRequest(person, "reject")}
                        className="rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </section>

            {/* Approved members */}
            <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="px-7 py-5">
                <h2 className="text-lg font-semibold text-slate-900">
                  Team members
                </h2>
              </div>

              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr className="border-y border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-7 py-4">Name</th>
                    <th className="px-7 py-4">Email</th>
                    <th className="px-7 py-4">Side</th>
                  </tr>
                </thead>

                <tbody>
                  {members.map((member) => (
                    <tr
                      key={member._id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-7 py-4 text-sm font-semibold text-slate-900">
                        {member.name}
                      </td>
                      <td className="px-7 py-4 text-sm text-slate-600">
                        {member.email}
                      </td>
                      <td className="px-7 py-4">
                        <select
                          value={member.role}
                          disabled={busyId === member._id}
                          onChange={(event) => changeRole(member, event.target.value)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 disabled:opacity-50"
                        >
                          <option value="manager">Manager</option>
                          <option value="sales">Sales team</option>
                        </select>
                      </td>
                    </tr>
                  ))}

                  {members.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-7 py-12 text-center text-sm text-slate-500">
                        No approved team members yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          </>
        )}
      </div>
    </main>
  );
}