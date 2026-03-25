import React, { useEffect, useState } from "react";
import api from "../../api/client";

function formatCents(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function AdminWinners() {
  const [winners, setWinners] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState({});

  async function load() {
    const res = await api.get("/admin/winners");
    setWinners(res.data.winners || []);
  }

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setBusy(true);
      setError("");
      try {
        await load();
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message || "Failed to load winners");
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  async function approve(winnerId) {
    setError("");
    await api.patch(`/admin/winners/${winnerId}/verification`, {
      verificationStatus: "approved",
      adminNotes: notes[winnerId] || ""
    });
    await load();
  }

  async function reject(winnerId) {
    setError("");
    await api.patch(`/admin/winners/${winnerId}/verification`, {
      verificationStatus: "rejected",
      adminNotes: notes[winnerId] || ""
    });
    await load();
  }

  async function markPaid(winnerId) {
    setError("");
    await api.patch(`/admin/winners/${winnerId}/payout`, { payoutStatus: "paid" });
    await load();
  }

  if (busy) return <div className="p-4 text-slate-300">Loading...</div>;

  return (
    <div className="space-y-4">
      {error ? <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-3">{error}</div> : null}

      <div className="card">
        <div className="text-lg font-semibold">Winners</div>
        <div className="text-sm text-slate-400 mt-1">Approve/reject winner proofs and mark payouts as completed.</div>
        <div className="mt-4 space-y-3">
          {winners.length ? (
            winners.map((w) => (
              <div key={w._id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="font-semibold">
                      {w.userId?.email || "User"} ({w.matchCount}-match)
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Month:{" "}
                      {w.drawId?.month ? new Date(w.drawId.month).toLocaleDateString(undefined, { year: "numeric", month: "long" }) : "—"}{" "}
                      | Numbers: {w.drawId?.numbers?.join(", ")}
                    </div>
                    <div className="mt-2 text-sm text-slate-300">
                      Amount: <span className="text-emerald-200 font-semibold">{formatCents(w.amountCents || 0)}</span>
                    </div>
                    <div className="mt-2 text-sm text-slate-300">
                      Verification: <span className="text-white font-medium">{w.verificationStatus}</span>
                    </div>
                    <div className="mt-1 text-sm text-slate-300">
                      Payout: <span className="text-white font-medium">{w.payoutStatus}</span>
                    </div>
                  </div>

                  <div className="w-full sm:w-auto">
                    {w.proofUrl ? (
                      <a href={w.proofUrl} target="_blank" rel="noreferrer" className="btn">
                        View proof
                      </a>
                    ) : (
                      <div className="text-xs text-slate-500">No proof uploaded yet.</div>
                    )}

                    {w.verificationStatus === "pending" ? (
                      <div className="mt-3 space-y-2">
                        <textarea
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-emerald-400/60 text-sm"
                          placeholder="Admin notes (optional)"
                          value={notes[w._id] || ""}
                          onChange={(e) => setNotes((prev) => ({ ...prev, [w._id]: e.target.value }))}
                        />
                        <div className="flex gap-2 flex-wrap">
                          <button className="btn btn-primary flex-1 text-slate-950" type="button" onClick={() => approve(w._id)}>
                            Approve
                          </button>
                          <button className="btn flex-1" type="button" onClick={() => reject(w._id)}>
                            Reject
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {w.verificationStatus === "approved" && w.payoutStatus === "pending" ? (
                      <div className="mt-3">
                        <button className="btn btn-primary w-full text-slate-950" type="button" onClick={() => markPaid(w._id)}>
                          Mark payout as paid
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-slate-500">No winner records yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

