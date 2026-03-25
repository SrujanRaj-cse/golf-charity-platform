import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { AuthContext } from "../auth/AuthProvider";
import PasswordCharacter from "../components/PasswordCharacter.jsx";

export default function Login() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/auth/login", { email, password });
      const token = res.data.token;
      await auth.login(token);
      const me = await auth.refreshUser();
      if (!me) {
        setError("Session expired. Please sign in again.");
        navigate("/login", { replace: true });
        return;
      }
      if (me?.role === "admin") navigate("/admin/users", { replace: true });
      else navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-8">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-6 items-center">
        <div className="hidden md:block">
          <div className="glass p-6 flex items-center justify-center">
            <PasswordCharacter coverEyes={passwordFocused} />
          </div>
        </div>

        <div>
          <div className="glass p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-2xl font-semibold">Welcome back</div>
                <div className="text-sm text-slate-400 mt-1">Sign in to manage scores and draws.</div>
              </div>
            </div>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-sm text-slate-300">Email</label>
                <input
                className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none transition
                focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30 focus:shadow-[0_0_0_1px_rgba(52,211,153,0.25)]"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm text-slate-300">Password</label>
                <input
                className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none transition
                focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30 focus:shadow-[0_0_0_1px_rgba(52,211,153,0.25)]"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  required
                />
              </div>

              {error ? <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-3">{error}</div> : null}

              <button className="btn btn-primary w-full text-slate-950" disabled={busy}>
                {busy ? "Signing in..." : "Sign in"}
              </button>

              <div className="text-sm text-slate-400 flex justify-between">
                <span>New here?</span>
                <button type="button" className="text-emerald-300 hover:text-emerald-200" onClick={() => navigate("/signup")}>
                  Create account
                </button>
              </div>
            </form>

            <div className="mt-4 text-xs text-slate-500">
              Tip: if this is the first run, create a user via signup. Admin access can be bootstrapped by `ADMIN_EMAIL`.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

