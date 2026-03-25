import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { AuthContext } from "../auth/AuthProvider";

export default function Signup() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/auth/signup", { email, password });
      const token = res.data.token;
      await auth.login(token);
      const me = await auth.refreshUser();
      if (!me) {
        setError("Session expired. Please sign up/sign in again.");
        navigate("/login", { replace: true });
        return;
      }
      if (me?.role === "admin") navigate("/admin/users", { replace: true });
      else navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Signup failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-md">
        <div className="glass p-6">
          <div className="text-2xl font-semibold">Create account</div>
          <div className="text-sm text-slate-400 mt-1">Start your subscription to unlock score entry.</div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm text-slate-300">Email</label>
              <input
                className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-emerald-400/60"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm text-slate-300">Password</label>
              <input
                className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-emerald-400/60"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error ? <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-3">{error}</div> : null}

            <button className="btn btn-primary w-full text-slate-950" disabled={busy}>
              {busy ? "Creating..." : "Create account"}
            </button>

            <div className="text-sm text-slate-400 flex justify-between">
              <span>Already have an account?</span>
              <button type="button" className="text-emerald-300 hover:text-emerald-200" onClick={() => navigate("/login")}>
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

