import React, { useEffect, useState } from "react";
import api from "../../api/client";

function formatCents(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    const res = await api.get("/admin/analytics");
    setData(res.data);
  }

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setBusy(true);
      setError("");
      try {
        await load();
        if (cancelled) return;
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message || "Failed to load analytics");
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  if (busy) return <div className="p-4 text-slate-300">Loading...</div>;

  return (
    <div className="space-y-4">
      {error ? <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-3">{error}</div> : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass p-4">
          <div className="text-sm text-slate-400">Total users</div>
          <div className="mt-1 text-xl font-semibold">{data?.totalUsers ?? "—"}</div>
        </div>
        <div className="glass p-4">
          <div className="text-sm text-slate-400">Active subscribers</div>
          <div className="mt-1 text-xl font-semibold">{data?.activeSubscribers ?? "—"}</div>
        </div>
        <div className="glass p-4 sm:col-span-2 lg:col-span-1">
          <div className="text-sm text-slate-400">Total prize pool</div>
          <div className="mt-1 text-xl font-semibold">{formatCents(data?.totalPrizePoolCents ?? 0)}</div>
        </div>
        <div className="glass p-4 sm:col-span-2 lg:col-span-3">
          <div className="text-sm text-slate-400">Draw statistics</div>
          <div className="mt-1 text-xl font-semibold">{data?.drawStats?.publishedDrawCount ?? 0} draws</div>
          <div className="mt-2 text-sm text-slate-300">
            Participants: {data?.drawStats?.participantsCount ?? 0} | Winners: {data?.drawStats?.winnersCount ?? 0}
          </div>
          <div className="mt-2 text-sm text-slate-300">
            Match distribution — 5:{data?.drawStats?.winners5Count ?? 0} | 4:{data?.drawStats?.winners4Count ?? 0} | 3:{data?.drawStats?.winners3Count ?? 0}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-lg font-semibold">Charity contribution totals</div>
            <div className="text-sm text-slate-400 mt-1">Computed from active subscribers and their selected charity percentage.</div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {data?.charityContributionTotals?.length ? (
            data.charityContributionTotals
              .slice(0, 20)
              .map((c) => (
                <div key={c.charityId} className="flex items-center justify-between gap-3 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                  <div>
                    <div className="font-semibold">{c.charityName}</div>
                    <div className="text-xs text-slate-400">{c.charityId}</div>
                  </div>
                  <div className="text-emerald-200 font-semibold">{formatCents(c.totalCents)}</div>
                </div>
              ))
          ) : (
            <div className="text-sm text-slate-500">No charity totals yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

