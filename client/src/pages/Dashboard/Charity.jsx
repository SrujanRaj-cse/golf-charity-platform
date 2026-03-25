import React, { useContext, useEffect, useState } from "react";
import api from "../../api/client";
import { AuthContext } from "../../auth/AuthProvider";

export default function Charity() {
  const auth = useContext(AuthContext);
  const [charities, setCharities] = useState([]);
  const [busy, setBusy] = useState(true);
  const [selectedId, setSelectedId] = useState(auth.user?.selectedCharity?._id || auth.user?.selectedCharity?.id || "");
  const [percent, setPercent] = useState(auth.user?.charityContributionPercent || 10);
  const [error, setError] = useState("");

  // PRD: Independent donations (no subscription required).
  const [donateCharityId, setDonateCharityId] = useState(selectedId || "");
  const [donateAmountDollars, setDonateAmountDollars] = useState(25);
  const [donateBusy, setDonateBusy] = useState(false);
  const [donateMsg, setDonateMsg] = useState("");
  const [donateErr, setDonateErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setBusy(true);
      setError("");
      try {
        const res = await api.get("/charities");
        if (!cancelled) setCharities(res.data.charities || []);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSelectedId(auth.user?.selectedCharity?._id || auth.user?.selectedCharity?.id || "");
    setPercent(auth.user?.charityContributionPercent || 10);
  }, [auth.user]);

  useEffect(() => {
    if (!donateCharityId && charities.length) {
      setDonateCharityId(charities[0]._id);
    }
  }, [charities, donateCharityId]);

  async function onSave() {
    setError("");
    if (!selectedId) {
      setError("Please select a charity.");
      return;
    }
    try {
      await api.post("/charities/select", { charityId: selectedId, contributionPercent: percent });
      await auth.refreshUser();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save charity selection");
    }
  }

  async function donate() {
    setDonateErr("");
    setDonateMsg("");
    if (!donateCharityId) {
      setDonateErr("Choose a charity to donate to.");
      return;
    }
    const cents = Math.round(Number(donateAmountDollars) * 100);
    if (!Number.isFinite(cents) || cents < 100) {
      setDonateErr("Donation must be at least $1.");
      return;
    }

    setDonateBusy(true);
    try {
      // Simulated payment UX.
      await new Promise((r) => setTimeout(r, 1200));
      await api.post("/donations", { charityId: donateCharityId, amountCents: cents });
      setDonateMsg("Donation confirmed. Thank you.");
    } catch (err) {
      setDonateErr(err?.response?.data?.message || "Donation failed");
    } finally {
      setDonateBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="text-lg font-semibold">Choose your charity</div>
        <div className="text-sm text-slate-400 mt-1">
          Your subscription includes a charity contribution. Minimum is 10%. You can increase it anytime.
        </div>

        {error ? <div className="mt-3 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-3">{error}</div> : null}

        <div className="mt-5">
          <div className="text-sm text-slate-300 mb-2">Contribution percentage</div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={10}
              max={100}
              step={1}
              value={percent}
              onChange={(e) => setPercent(Number(e.target.value))}
              className="w-full"
            />
            <div className="min-w-16 text-center px-3 py-2 rounded-xl border border-white/10 bg-white/5">
              {percent}%
            </div>
          </div>
        </div>

        <button className="btn btn-primary mt-4 text-slate-950" type="button" onClick={onSave} disabled={busy}>
          Save selection
        </button>
      </div>

      <div className="card">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-lg font-semibold">Donate independently</div>
            <div className="text-sm text-slate-400 mt-1">Support a charity even without participating in the draw.</div>
          </div>
          {donateMsg ? <div className="text-sm text-emerald-200 font-medium">{donateMsg}</div> : null}
        </div>

        {donateErr ? <div className="mt-3 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-3">{donateErr}</div> : null}

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-slate-300">Donate to</label>
            <select
              value={donateCharityId}
              onChange={(e) => setDonateCharityId(e.target.value)}
              className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-emerald-400/60 transition"
              disabled={busy || charities.length === 0}
            >
              {charities.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-300">Amount</label>
            <div className="flex items-center gap-2 mt-1">
              {[10, 25, 50, 100].map((a) => (
                <button
                  key={a}
                  type="button"
                  className={`btn px-3 py-2 ${donateAmountDollars === a ? "btn-primary text-slate-950" : "bg-white/5 border border-white/10 hover:bg-white/10"}`}
                  onClick={() => setDonateAmountDollars(a)}
                  disabled={donateBusy}
                >
                  ${a}
                </button>
              ))}
            </div>
            <input
              type="number"
              min={1}
              step={1}
              value={donateAmountDollars}
              onChange={(e) => setDonateAmountDollars(Number(e.target.value))}
              className="mt-3 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-emerald-400/60 transition"
              disabled={donateBusy}
            />
          </div>
        </div>

        <button className="btn btn-primary w-full mt-4 text-slate-950 disabled:opacity-60" type="button" onClick={donate} disabled={donateBusy}>
          {donateBusy ? "Processing payment..." : `Donate $${Number(donateAmountDollars).toFixed(0)}`}
        </button>
      </div>

      <div className="card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Charity directory</div>
            <div className="text-sm text-slate-400 mt-1">{charities.length} charities</div>
          </div>
        </div>

        {busy ? (
          <div className="mt-4 text-slate-500 text-sm">Loading...</div>
        ) : (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {charities.map((c) => {
              const isSelected = String(selectedId) === String(c._id);
              return (
                <div key={c._id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => setSelectedId(c._id)}
                        className="block w-full text-left"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="font-semibold">{c.name}</div>
                          {c.isSpotlight ? (
                            <div className="text-xs text-emerald-200 bg-emerald-500/10 border border-emerald-400/20 px-2 py-1 rounded-full">
                              Spotlight
                            </div>
                          ) : null}
                          {isSelected ? (
                            <div className="text-xs text-emerald-200">Selected</div>
                          ) : null}
                        </div>
                        <div className="mt-2 text-xs text-slate-400 line-clamp-3">{c.description}</div>
                      </button>
                    </div>
                    <button
                      type="button"
                      className="btn flex-none px-3 bg-white/5 border border-white/10 hover:bg-white/10"
                      onClick={() => setDonateCharityId(c._id)}
                      disabled={donateBusy}
                    >
                      Donate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

