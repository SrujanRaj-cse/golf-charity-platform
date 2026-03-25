import React, { useContext, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/client";
import { AuthContext } from "../auth/AuthProvider";

export default function CharityProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  const [charity, setCharity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [donationCents, setDonationCents] = useState(5000);
  const [donBusy, setDonBusy] = useState(false);
  const [donMsg, setDonMsg] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await api.get(`/charities/${id}`);
        if (!cancelled) setCharity(res.data.charity || null);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
        if (!cancelled) setError(err?.response?.data?.message || "Failed to load charity");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const images = useMemo(() => {
    if (!charity) return [];
    if (Array.isArray(charity.images) && charity.images.length) return charity.images;
    if (charity.imageUrl) return [charity.imageUrl];
    return [];
  }, [charity]);

  const upcomingEvents = useMemo(() => {
    if (!charity) return [];
    return Array.isArray(charity.upcomingEvents) ? charity.upcomingEvents : [];
  }, [charity]);

  async function donate() {
    setDonMsg("");
    setDonBusy(true);
    try {
      if (!auth.token) {
        navigate("/login", { state: { from: `/charities/${id}` } });
        return;
      }
      await api.post("/donations", {
        charityId: id,
        amountCents: donationCents
      });
      setDonMsg("Donation confirmed. Thank you for supporting this cause.");
    } catch (err) {
      setDonMsg(err?.response?.data?.message || "Donation failed. Please try again.");
    } finally {
      setDonBusy(false);
    }
  }

  if (loading) return <div className="p-10 text-slate-300">Loading...</div>;
  if (error) return <div className="p-10 text-red-300">{error}</div>;
  if (!charity) return <div className="p-10 text-slate-300">Charity not found.</div>;

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-5 pt-16 pb-10 space-y-6">
        <div className="card overflow-hidden">
          {images[0] ? (
            <img
              src={images[0]}
              alt={charity.name}
              className="w-full h-72 object-cover border-b border-white/10"
              loading="lazy"
            />
          ) : null}

          <div className="p-5 sm:p-7 space-y-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="text-3xl font-semibold">{charity.name}</div>
                {charity.isSpotlight ? (
                  <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full border border-emerald-300/30 bg-emerald-300/10 text-emerald-200 text-sm">
                    Spotlight charity
                  </div>
                ) : null}
              </div>
              {images.length > 1 ? (
                <div className="hidden sm:flex gap-2">
                  {images.slice(1, 4).map((src) => (
                    <img
                      key={src}
                      src={src}
                      alt={`${charity.name} image`}
                      className="h-16 w-16 object-cover rounded-xl border border-white/10"
                      loading="lazy"
                    />
                  ))}
                </div>
              ) : null}
            </div>

            {charity.description ? (
              <div className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {charity.description}
              </div>
            ) : null}

            {upcomingEvents.length ? (
              <div className="pt-4 border-t border-white/10">
                <div className="text-lg font-semibold">Upcoming events</div>
                <div className="mt-3 space-y-3">
                  {upcomingEvents.map((ev, idx) => (
                    <div key={`${ev.title}-${idx}`} className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="font-semibold">{ev.title}</div>
                        <div className="text-xs text-slate-400">
                          {ev.date ? new Date(ev.date).toLocaleDateString() : ""}
                        </div>
                      </div>
                      {ev.description ? (
                        <div className="mt-2 text-sm text-slate-400">{ev.description}</div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          <div className="lg:col-span-2 card p-5 sm:p-7">
            <div className="text-lg font-semibold">Independent donation</div>
            <div className="mt-1 text-sm text-slate-400">
              Support this charity even if you’re not participating in the draw.
            </div>

            <div className="mt-5">
              <div className="flex gap-2 flex-wrap">
                {[1000, 2500, 5000, 10000].map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`btn ${donationCents === c ? "btn-primary text-slate-950" : "bg-white/5 border border-white/10 hover:bg-white/10"} `}
                    onClick={() => setDonationCents(c)}
                  >
                    ${(c / 100).toFixed(2)}
                  </button>
                ))}
              </div>

              <div className="mt-4">
                <label className="text-sm text-slate-300">Custom amount (cents)</label>
                <input
                  type="number"
                  min={1}
                  value={donationCents}
                  onChange={(e) => setDonationCents(Number(e.target.value))}
                  className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-emerald-400/60 transition"
                />
              </div>
            </div>
          </div>

          <div className="card p-5 sm:p-7">
            <div className="text-lg font-semibold">Donate now</div>
            <div className="mt-2 text-sm text-slate-400">
              Amount: <span className="text-emerald-200 font-semibold">${(donationCents / 100).toFixed(2)}</span>
            </div>

            <button
              type="button"
              disabled={donBusy || !donationCents}
              onClick={donate}
              className="btn btn-primary text-slate-950 w-full mt-5 disabled:opacity-60"
            >
              {donBusy ? "Processing..." : "Donate"}
            </button>

            {donMsg ? (
              <div className="mt-3 text-sm text-slate-300 bg-white/5 border border-white/10 rounded-xl p-3">
                {donMsg}
              </div>
            ) : null}
            {!auth.token ? (
              <div className="mt-3 text-xs text-slate-500">
                Sign in to make a donation.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

