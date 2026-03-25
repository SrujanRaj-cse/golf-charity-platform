import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import { AuthContext } from "../../auth/AuthProvider";

function formatMonth(d) {
  const dt = new Date(d);
  return dt.toLocaleDateString(undefined, { year: "numeric", month: "short" });
}

function formatCents(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function Overview() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [scores, setScores] = useState([]);
  const [drawHistory, setDrawHistory] = useState([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [scoresRes, drawsRes] = await Promise.all([api.get("/scores"), api.get("/draw/me")]);
        if (!cancelled) {
          setScores(scoresRes.data.scores || []);
          setDrawHistory(drawsRes.data.draws || []);
        }
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

  const latestDraw = drawHistory?.[0];
  const latestWinning = latestDraw?.winning;
  const isSubscriber = (auth.user?.subscription_status || auth.user?.subscriptionStatus) === "active";
  const plan = auth.user?.subscription_plan || auth.user?.subscriptionPlanType;
  const status = auth.user?.subscription_status || auth.user?.subscriptionStatus;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card">
          <div className="text-sm text-slate-400">Subscription</div>
          <div className="mt-2 text-2xl font-semibold">
            {plan === "yearly" ? "Yearly" : plan === "monthly" ? "Monthly" : "—"} Plan
          </div>
          <div className="mt-2 text-sm text-slate-300">
            Status:{" "}
            <span className="text-emerald-200 font-medium">{status}</span>
          </div>
          <div className="mt-2 text-sm text-slate-400">
            Renews at:{" "}
            {auth.user?.subscription_start_date ? new Date(auth.user.subscription_start_date).toLocaleString() : auth.user?.subscriptionRenewsAt ? new Date(auth.user.subscriptionRenewsAt).toLocaleString() : "—"}
          </div>
        </div>

        <div className="card">
          <div className="text-sm text-slate-400">Charity selection</div>
          <div className="mt-2 font-semibold">{auth.user?.selectedCharity?.name || "Not selected yet"}</div>
          <div className="mt-2 text-sm text-slate-300">
            Contribution:{" "}
            <span className="text-cyan-200 font-medium">{auth.user?.charityContributionPercent || 10}%</span> of subscription
          </div>
        </div>

        <div className="card">
          <div className="text-sm text-slate-400">{isSubscriber ? "Participation signal" : "Draw previews"}</div>
          <div className="mt-2 text-2xl font-semibold">
            {isSubscriber ? `${drawHistory.length} draws` : `${drawHistory.length} published draws`}
          </div>
          <div className="mt-2 text-sm text-slate-300">
            {isSubscriber ? (
              <>
                Latest match:{" "}
                <span className="text-white">
                  {latestDraw?.matchCount != null ? `${latestDraw.matchCount} numbers` : "—"}
                </span>
              </>
            ) : (
              <>
                Upgrade to participate in this month’s draw.
                <div className="mt-3">
                  <button
                    type="button"
                    className="btn btn-primary text-slate-950"
                    onClick={() => navigate("/subscribe")}
                  >
                    Upgrade to subscribe
                  </button>
                </div>
              </>
            )}
          </div>
          {isSubscriber ? (
            latestWinning ? (
              <div className="mt-2 text-sm text-slate-300">
                Latest reward:{" "}
                <span className="text-emerald-200 font-medium">{formatCents(latestWinning.amountCents)}</span>
              </div>
            ) : (
              <div className="mt-2 text-sm text-slate-400">No rewards for the latest draw.</div>
            )
          ) : (
            <div className="mt-2 text-sm text-slate-400">
              Free users can score, choose charity, and preview draws. Rewards require an active subscription.
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm text-slate-400">Your last 5 scores</div>
              <div className="mt-1 text-lg font-semibold">{busy ? "Loading..." : `${scores.length}/5 saved`}</div>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {scores.map((s) => (
              <div key={s.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                <div className="text-sm text-slate-300">
                  {new Date(s.date).toLocaleDateString()} 
                </div>
                <div className="text-emerald-200 font-semibold">{s.value}</div>
              </div>
            ))}
            {!scores.length ? <div className="text-sm text-slate-500">Add scores in `Scores` tab.</div> : null}
          </div>
        </div>

        <div className="card">
          <div className="text-sm text-slate-400">How you win</div>
          <div className="mt-2 text-lg font-semibold">3/4/5 matches</div>
          <div className="mt-2 text-sm text-slate-300 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <span>Match 5 numbers</span>
              <span className="text-cyan-200">Jackpot (rolls over)</span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span>Match 4 numbers</span>
              <span className="text-cyan-200">Tier prize</span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span>Match 3 numbers</span>
              <span className="text-cyan-200">Tier prize</span>
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-500">
            Your score set is always capped to the latest 5 entries.
          </div>
        </div>
      </div>

    </div>
  );
}

