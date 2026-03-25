import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/client";
import { AuthContext } from "../auth/AuthProvider";

function formatCents(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function Subscribe() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const success = params.get("success");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!auth.token) return;
    if (!success) return;
    auth.refreshUser().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success, auth.token]);

  useEffect(() => {
    const status = auth.user?.subscription_status || auth.user?.subscriptionStatus;
    if (auth.token && status === "active") {
      // If user is already active, send them to dashboard.
      navigate("/dashboard", { replace: true });
    }
  }, [auth.token, auth.user, navigate]);

  async function startCheckout(planType) {
    setBusy(true);
    setError("");
    try {
      // Simulated payment delay (1–2 seconds) to mimic real SaaS checkout UX.
      const delayMs = 1000 + Math.floor(Math.random() * 1000);
      await new Promise((r) => setTimeout(r, delayMs));

      await api.post("/billing/checkout-session", { planType });
      await auth.refreshUser();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Checkout failed");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!auth.loading && !auth.token) navigate("/login", { replace: true });
  }, [auth.loading, auth.token, navigate]);

  if (auth.loading) return <div className="p-10 text-slate-300">Loading...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-5xl">
        <div className="glass p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="text-2xl font-semibold">Choose your subscription</div>
              <div className="text-sm text-slate-400 mt-1">
                Free users can manage scores and choose a charity. Subscribed users can participate in draws and claim rewards.
              </div>
            </div>
            <button className="btn" onClick={() => navigate("/")}>
              Back to home
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card relative overflow-hidden transition hover:-translate-y-0.5 hover:border-white/20">
              <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-emerald-500/10 blur" />
              <div className="relative">
                <div className="text-white font-semibold">Monthly</div>
                <div className="mt-2 text-3xl font-semibold">{formatCents(2500)}</div>
                <div className="mt-1 text-sm text-slate-300">Participate in every draw.</div>

                <ul className="mt-4 space-y-2 text-sm text-slate-200">
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400/80" /> Participate in draws
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400/80" /> Win rewards
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400/80" /> Support charity
                  </li>
                </ul>

                <button
                  className="btn btn-primary mt-5 w-full text-slate-950 transition hover:brightness-110"
                  disabled={busy}
                  onClick={() => startCheckout("monthly")}
                  type="button"
                >
                  {busy ? "Processing payment..." : "Subscribe Monthly"}
                </button>
              </div>
            </div>

            <div className="card relative overflow-hidden transition hover:-translate-y-0.5 hover:border-white/20">
              <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-cyan-500/10 blur" />
              <div className="absolute top-4 right-4 rounded-full px-3 py-1 text-xs border border-emerald-300/30 bg-emerald-300/10 text-emerald-200">
                Best Value
              </div>
              <div className="relative pt-2">
                <div className="text-white font-semibold">Yearly</div>
                <div className="mt-2 text-3xl font-semibold">{formatCents(25000)}</div>
                <div className="mt-1 text-sm text-slate-300">Discounted annual plan.</div>

                <ul className="mt-4 space-y-2 text-sm text-slate-200">
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400/80" /> Participate in draws
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400/80" /> Win rewards
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400/80" /> Support charity
                  </li>
                </ul>

                <button
                  className="btn btn-primary mt-5 w-full text-slate-950 transition hover:brightness-110"
                  disabled={busy}
                  onClick={() => startCheckout("yearly")}
                  type="button"
                >
                  {busy ? "Processing payment..." : "Subscribe Yearly"}
                </button>
              </div>
            </div>
          </div>

          {error ? <div className="mt-4 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-3">{error}</div> : null}

          <div className="mt-6 text-xs text-slate-500 leading-relaxed">
            This build simulates payment. The backend updates your subscription status after a short delay.
            You can replace the simulation later with real Stripe without changing the UI structure.
          </div>
        </div>
      </div>
    </div>
  );
}

