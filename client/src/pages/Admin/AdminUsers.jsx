import React, { useEffect, useState } from "react";
import api from "../../api/client";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [scores, setScores] = useState([]);
  const [subBusy, setSubBusy] = useState(false);

  async function loadUsers() {
    const res = await api.get("/admin/users");
    setUsers(res.data.users || []);
  }

  async function loadScores(userId) {
    const res = await api.get(`/admin/users/${userId}/scores`);
    setScores(res.data.scores || []);
  }

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setBusy(true);
      setError("");
      try {
        await loadUsers();
        if (!cancelled && users.length && !selectedUserId) {
          // no-op
        }
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message || "Failed to load users");
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function selectUser(userId) {
    setSelectedUserId(userId);
    setError("");
    await loadScores(userId);
  }

  async function updateSubscription(nextStatus, planType) {
    if (!selectedUserId) return;
    setSubBusy(true);
    setError("");
    try {
      await api.patch(`/admin/users/${selectedUserId}/subscription`, {
        status: nextStatus,
        planType
      });
      await loadUsers();
      await loadScores(selectedUserId);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update subscription");
    } finally {
      setSubBusy(false);
    }
  }

  // PRD: Admin score control is view-only.

  if (busy) return <div className="p-4 text-slate-300">Loading...</div>;

  return (
    <div className="space-y-4">
      {error ? <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-3">{error}</div> : null}

      <div className="card">
        <div className="text-lg font-semibold">Users</div>
        <div className="text-sm text-slate-400 mt-1">View subscription status and manage the latest 5 scores.</div>
        <div className="mt-4 space-y-3">
          {users.map((u) => (
            <button
              key={u._id}
              type="button"
              onClick={() => selectUser(u._id)}
              className="w-full text-left bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl p-4 transition"
            >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="font-semibold">{u.email}</div>
                  <div className="text-xs text-slate-400 mt-1">{u.role}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-300">
                    Status:{" "}
                    <span className="text-emerald-200 font-medium">
                      {u.subscription_status || u.subscriptionStatus}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Plan: {u.subscription_plan || u.subscriptionPlanType || "—"}{" "}
                    {u.subscription_start_date
                      ? `| Started: ${new Date(u.subscription_start_date).toLocaleDateString()}`
                      : u.subscriptionRenewsAt
                        ? `| Renews: ${new Date(u.subscriptionRenewsAt).toLocaleDateString()}`
                        : ""}
                  </div>
                </div>
              </div>
            </button>
          ))}
          {!users.length ? <div className="text-sm text-slate-500">No users found.</div> : null}
        </div>
      </div>

      {selectedUserId ? (
        <div className="card">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-lg font-semibold">Score management</div>
              <div className="text-sm text-slate-400 mt-1">Latest 5 scores for selected user.</div>
            </div>
            <button className="btn" type="button" onClick={() => setSelectedUserId(null)}>
              Close
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {scores.map((s) => (
              <div key={s._id} className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="text-sm text-slate-300">{new Date(s.date).toLocaleDateString()}</div>
                    <div className="text-emerald-200 font-semibold mt-1">{s.value}</div>
                  </div>
                  <div className="text-xs text-slate-500">View only</div>
                </div>
              </div>
            ))}
            {!scores.length ? <div className="text-sm text-slate-500">No scores.</div> : null}
          </div>

          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="text-lg font-semibold">Manage subscription</div>
            <div className="text-sm text-slate-400 mt-1">Simulated activation for testing admin flows.</div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                className="btn btn-primary text-slate-950"
                type="button"
                disabled={subBusy}
                onClick={() => updateSubscription("active", "monthly")}
              >
                Activate Monthly
              </button>
              <button
                className="btn btn-primary text-slate-950"
                type="button"
                disabled={subBusy}
                onClick={() => updateSubscription("active", "yearly")}
              >
                Activate Yearly
              </button>
              <button
                className="btn flex-1"
                type="button"
                disabled={subBusy}
                onClick={() => updateSubscription("inactive", null)}
              >
                Set Inactive
              </button>
              <button
                className="btn flex-1 bg-white/5 border border-white/10 hover:bg-white/10"
                type="button"
                disabled={subBusy}
                onClick={() => updateSubscription("expired", null)}
              >
                Set Expired
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

