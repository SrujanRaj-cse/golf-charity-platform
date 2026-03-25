import React, { useEffect, useState } from "react";
import api from "../api/client";
import { useNavigate } from "react-router-dom";

export default function Charities() {
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [spotlightOnly, setSpotlightOnly] = useState(false);
  const [hasEventsOnly, setHasEventsOnly] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await api.get("/charities", {
          params: {
            q: query || undefined,
            spotlight: spotlightOnly ? "true" : undefined,
            hasEvents: hasEventsOnly ? "true" : undefined
          }
        });
        if (!cancelled) setCharities(res.data.charities || []);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
        if (!cancelled) setError(err?.response?.data?.message || "Failed to load charities");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [query, spotlightOnly, hasEventsOnly]);

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-5 pt-16 pb-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="text-3xl font-semibold">Charities</div>
            <div className="mt-2 text-sm text-slate-400">Explore causes your subscription can support.</div>
          </div>

          <div className="w-full md:max-w-md">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search charities..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-emerald-400/60 transition focus:ring-2 focus:ring-emerald-400/30"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={spotlightOnly}
              onChange={(e) => setSpotlightOnly(e.target.checked)}
              className="h-4 w-4 accent-emerald-400"
            />
            Spotlight only
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={hasEventsOnly}
              onChange={(e) => setHasEventsOnly(e.target.checked)}
              className="h-4 w-4 accent-emerald-400"
            />
            Has upcoming events
          </label>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="sm:col-span-2 lg:col-span-3 text-slate-400">Loading...</div>
          ) : charities.length ? (
            charities.map((c) => (
              <button
                key={c._id}
                type="button"
                onClick={() => navigate(`/charities/${c._id}`)}
                className="text-left card transition hover:-translate-y-0.5"
              >
                {Array.isArray(c.images) && c.images[0] ? (
                  <img
                    src={c.images[0]}
                    alt={c.name}
                    className="w-full h-40 object-cover rounded-xl mb-3 border border-white/10"
                    loading="lazy"
                  />
                ) : null}
                <div className="flex items-start justify-between gap-3">
                  <div className="font-semibold">{c.name}</div>
                  {c.isSpotlight ? (
                    <div className="text-xs px-2 py-1 rounded-full border border-emerald-300/30 bg-emerald-300/10 text-emerald-200">
                      Spotlight
                    </div>
                  ) : null}
                </div>
                {c.description ? <div className="mt-2 text-sm text-slate-400 line-clamp-4">{c.description}</div> : null}
              </button>
            ))
          ) : (
            <div className="sm:col-span-2 lg:col-span-3 text-slate-500">No charities found.</div>
          )}
        </div>

        {error ? <div className="mt-4 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-3">{error}</div> : null}
      </div>
    </div>
  );
}

