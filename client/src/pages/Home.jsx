import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

export default function Home() {
  const navigate = useNavigate();
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await api.get("/charities");
        if (!cancelled) setCharities(res.data.charities || []);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const featured = useMemo(() => charities.slice(0, 6), [charities]);

  return (
    <div className="min-h-screen">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-slate-950 to-slate-950" />
        <div className="relative max-w-6xl mx-auto px-5 pt-16 pb-10">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-10">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-slate-200">
                Subscription-based score rewards + real-world giving
              </div>
              <h1 className="mt-6 text-4xl md:text-5xl font-semibold leading-tight">
                Play smart. Win prizes.
                <span className="block bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  Fund the charity you choose.
                </span>
              </h1>
              <p className="mt-5 text-slate-300">
                Enter your last 5 scores (1–45). Every month, your scores are compared against admin-generated 5-number draws.
                Match 3, 4, or 5 numbers to unlock rewards. A meaningful portion of your subscription supports your selected charity.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button className="btn btn-primary text-slate-950" onClick={() => navigate("/subscribe")}>
                  Subscribe
                </button>
                <button className="btn" onClick={() => navigate("/login")}>
                  Sign in
                </button>
              </div>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="card">
                  <div className="text-sm text-slate-300">Score window</div>
                  <div className="text-2xl font-semibold mt-1">Latest 5</div>
                </div>
                <div className="card">
                  <div className="text-sm text-slate-300">Draw cadence</div>
                  <div className="text-2xl font-semibold mt-1">Monthly</div>
                </div>
                <div className="card">
                  <div className="text-sm text-slate-300">Reward tiers</div>
                  <div className="text-2xl font-semibold mt-1">3 / 4 / 5</div>
                </div>
              </div>
            </div>

            <div className="w-full lg:max-w-md">
              <div className="glass p-5">
                <div className="font-semibold text-white">How the draw works</div>
                <div className="mt-3 space-y-3 text-sm text-slate-300">
                  <div className="flex items-start justify-between gap-3">
                    <span>Admin generates 5 random numbers</span>
                    <span className="text-emerald-200">1–45</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span>Your last 5 scores are matched</span>
                    <span className="text-emerald-200">intersection</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span>Match 5 numbers</span>
                    <span className="text-cyan-200">jackpot</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span>Match 4 or 3 numbers</span>
                    <span className="text-cyan-200">tier prizes</span>
                  </div>
                </div>
              </div>

              <div className="glass p-5 mt-4">
                <div className="font-semibold text-white">Featured charities</div>
                {loading ? (
                  <div className="mt-3 text-slate-400 text-sm">Loading...</div>
                ) : featured.length ? (
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    {featured.map((c) => (
                      <button
                        key={c._id}
                        type="button"
                        className="text-left hover:bg-white/5 rounded-xl p-3 transition border border-white/5"
                        onClick={() => navigate(`/charities/${c._id}`)}
                      >
                        {Array.isArray(c.images) && c.images[0] ? (
                          <img
                            src={c.images[0]}
                            alt={c.name}
                            className="w-full h-28 object-cover rounded-xl mb-2 border border-white/10"
                            loading="lazy"
                          />
                        ) : null}
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-slate-400 line-clamp-2">{c.description}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 text-slate-400 text-sm">No charities yet.</div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-10 grid md:grid-cols-3 gap-3">
            <div className="card">
              <div className="font-semibold">Emotional, modern experience</div>
              <div className="mt-1 text-slate-300 text-sm">Dark fintech UI with smooth transitions and card-based layout.</div>
            </div>
            <div className="card">
              <div className="font-semibold">Score entry that stays simple</div>
              <div className="mt-1 text-slate-300 text-sm">Only the latest 5 scores are kept automatically.</div>
            </div>
            <div className="card">
              <div className="font-semibold">Admin-controlled rewards</div>
              <div className="mt-1 text-slate-300 text-sm">Simulation previews plus monthly publishing.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

