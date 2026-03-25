import React, { useState } from "react";
import api from "../../api/client";

function monthToDate(monthStr) {
  // monthStr format: YYYY-MM
  const [y, m] = monthStr.split("-").map((x) => Number(x));
  return new Date(Date.UTC(y, m - 1, 1));
}

export default function AdminRunDraw() {
  const today = new Date();
  const initialMonth = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, "0")}`;

  const [month, setMonth] = useState(initialMonth);
  const [mode, setMode] = useState("simulation");
  const [logicType, setLogicType] = useState("random");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function run() {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const res = await api.post("/draw/run", { mode, month: monthToDate(month), logicType });
      setResult(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Draw run failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {error ? <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-3">{error}</div> : null}

      <div className="card">
        <div className="text-lg font-semibold">Run monthly draw</div>
        <div className="text-sm text-slate-400 mt-1">Generate 5 numbers and compare them with subscribers’ latest 5 scores.</div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="text-sm text-slate-300">Month</label>
            <input
              type="month"
              className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-emerald-400/60"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-slate-300">Mode</label>
            <select
              className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-emerald-400/60"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              <option value="simulation">Simulation (pre-analysis)</option>
              <option value="published">Published (persist winners)</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-300">Draw logic</label>
            <select
              className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-emerald-400/60"
              value={logicType}
              onChange={(e) => setLogicType(e.target.value)}
            >
              <option value="random">Random</option>
              <option value="algorithmic">Algorithmic (weighted)</option>
            </select>
          </div>
          <div>
            <button className="btn btn-primary w-full text-slate-950" type="button" disabled={busy} onClick={run}>
              {busy ? "Running..." : mode === "simulation" ? "Simulate" : "Publish"}
            </button>
          </div>
        </div>
      </div>

      {result ? (
        <div className="card">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-sm text-slate-400">Draw numbers</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {result.numbers?.map((n) => (
                  <div key={n} className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 font-semibold text-emerald-200">
                    {n}
                  </div>
                ))}
              </div>
              <div className="mt-3 text-sm text-slate-300">
                Prize pool:{" "}
                <span className="text-emerald-200 font-semibold">${((result.prizePoolTotalCents || 0) / 100).toFixed(2)}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400">Mode</div>
              <div className="mt-2 text-lg font-semibold">{result.mode}</div>
              <div className="mt-2 text-xs text-slate-500">Month: {result.month ? new Date(result.month).toLocaleDateString() : "—"}</div>
            </div>
          </div>

          {mode === "simulation" ? (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="glass p-4">
                  <div className="text-sm text-slate-400">5-match winners</div>
                  <div className="text-xl font-semibold mt-1">{result.winnersPreview?.winners5Count ?? 0}</div>
                </div>
                <div className="glass p-4">
                  <div className="text-sm text-slate-400">4-match winners</div>
                  <div className="text-xl font-semibold mt-1">{result.winnersPreview?.winners4Count ?? 0}</div>
                </div>
                <div className="glass p-4">
                  <div className="text-sm text-slate-400">3-match winners</div>
                  <div className="text-xl font-semibold mt-1">{result.winnersPreview?.winners3Count ?? 0}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {[
                  { key: "five", label: "5-match", accent: "text-emerald-200", list: result.winnersPreview?.preview?.five || [] },
                  { key: "four", label: "4-match", accent: "text-cyan-200", list: result.winnersPreview?.preview?.four || [] },
                  { key: "three", label: "3-match", accent: "text-slate-200", list: result.winnersPreview?.preview?.three || [] }
                ].map((tier) => (
                  <div key={tier.key} className="card">
                    <div className="text-sm text-slate-400">{tier.label}</div>
                    {tier.list.length ? (
                      <div className="mt-3 space-y-2">
                        {tier.list.map((w) => (
                          <div
                            key={String(w.userId)}
                            className="flex items-center justify-between gap-3 bg-white/5 border border-white/10 rounded-xl p-3"
                          >
                            <div className="text-xs text-slate-300 truncate max-w-[60%]">{String(w.userId)}</div>
                            <div className={`text-xs font-semibold ${tier.accent}`}>{w.amountCents != null ? `$${(w.amountCents / 100).toFixed(2)}` : "—"}</div>
                          </div>
                        ))}
                        {tier.list.length >= 20 ? <div className="text-xs text-slate-500">Showing first 20</div> : null}
                      </div>
                    ) : (
                      <div className="mt-3 text-sm text-slate-500">No matches</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-4 text-sm text-slate-300">
              Winners published:{" "}
              <span className="text-emerald-200 font-semibold">
                5:{result.winners?.winners5Count ?? 0}, 4:{result.winners?.winners4Count ?? 0}, 3:{result.winners?.winners3Count ?? 0}
              </span>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

