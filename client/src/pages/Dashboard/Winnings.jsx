import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import { AuthContext } from "../../auth/AuthProvider";

function formatCents(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function Winnings() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const isSubscriber = (auth.user?.subscription_status || auth.user?.subscriptionStatus) === "active";
  const [draws, setDraws] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    const res = await api.get("/draw/me");
    setDraws(res.data.draws || []);
  }

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setBusy(true);
      setError("");
      try {
        await load();
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message || "Failed to load winnings");
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  async function uploadProof(winnerId, file) {
    setError("");
    const fd = new FormData();
    fd.append("proof", file);
    await api.post(`/admin/winners/${winnerId}/proof`, fd);
    await load();
  }

  if (busy) return <div className="p-4 text-slate-300">Loading...</div>;

  return (
    <div className="space-y-4">
      {!isSubscriber ? (
        <div className="card">
          <div className="text-lg font-semibold">Upgrade to participate in draws</div>
          <div className="mt-1 text-sm text-slate-300">
            Free users can manage scores and charity. Monthly draw participation and winnings require an active subscription.
          </div>
          <div className="mt-3">
            <button type="button" className="btn btn-primary text-slate-950" onClick={() => navigate("/subscribe")}>
              Subscribe now
            </button>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            After upgrading, your match eligibility and reward proofs become available here.
          </div>
        </div>
      ) : null}

      <div className="card">
        <div className="text-lg font-semibold">Your draw history & rewards</div>
        <div className="text-sm text-slate-400 mt-1">Match 3/4/5 numbers to qualify. Submit proof for verification when required.</div>
      </div>

      {error ? <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-3">{error}</div> : null}

      <div className="space-y-3">
        {draws.length ? (
          draws.map((d) => (
            <div key={String(d.drawId)} className="card">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-sm text-slate-400">{new Date(d.month).toLocaleDateString(undefined, { year: "numeric", month: "long" })}</div>
                  <div className="mt-1 font-semibold">Numbers: {d.numbers.join(", ")}</div>
                  <div className="mt-2 text-sm text-slate-300">
                    Matched:{" "}
                    <span className="text-emerald-200 font-medium">{d.matchCount == null ? "—" : d.matchCount}</span>
                  </div>
                </div>
                <div className="text-right">
                  {d.winning ? (
                    <>
                      <div className="text-sm text-slate-400">Reward</div>
                      <div className="text-lg font-semibold text-emerald-200">{formatCents(d.winning.amountCents)}</div>
                      <div className="mt-2 text-sm text-slate-300">
                        Verification:{" "}
                        <span className="text-white font-medium">
                          {d.winning.verificationStatus}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-slate-300">
                        Payout:{" "}
                        <span className="text-white font-medium">
                          {d.winning.payoutStatus}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-slate-500">No reward this month.</div>
                  )}
                </div>
              </div>

              {d.winning && d.winning.verificationStatus === "pending" ? (
                <div className="mt-4">
                  <div className="text-sm text-slate-300">Upload your proof screenshot</div>
                  <div className="mt-2 flex items-center gap-3 flex-wrap">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        uploadProof(d.winning.winnerId, f).catch(() => {});
                      }}
                      className="block text-sm text-slate-300"
                    />
                  </div>
                </div>
              ) : d.winning && d.winning.proofUrl ? (
                <div className="mt-4">
                  <div className="text-sm text-slate-300">Proof submitted</div>
                  <a
                    href={d.winning.proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn mt-2"
                  >
                    View proof
                  </a>
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <div className="text-sm text-slate-500">No draw history yet.</div>
        )}
      </div>
    </div>
  );
}

