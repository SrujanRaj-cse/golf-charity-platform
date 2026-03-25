import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import { AuthContext } from "../../auth/AuthProvider";

export default function ProfileSettings() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const [charities, setCharities] = useState([]);
  const [charBusy, setCharBusy] = useState(false);
  const [charErr, setCharErr] = useState("");

  const [selectedCharityId, setSelectedCharityId] = useState(auth.user?.selectedCharity?._id || "");
  const [contributionPercent, setContributionPercent] = useState(auth.user?.charityContributionPercent || 10);

  const [pwdOld, setPwdOld] = useState("");
  const [pwdNew, setPwdNew] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);
  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdErr, setPwdErr] = useState("");

  const [saveBusy, setSaveBusy] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveErr, setSaveErr] = useState("");

  useEffect(() => {
    setSelectedCharityId(auth.user?.selectedCharity?._id || "");
    setContributionPercent(auth.user?.charityContributionPercent || 10);
  }, [auth.user]);

  useEffect(() => {
    let cancelled = false;
    async function loadCharities() {
      setCharBusy(true);
      setCharErr("");
      try {
        const res = await api.get("/charities");
        if (!cancelled) setCharities(res.data.charities || []);
      } catch (err) {
        if (!cancelled) setCharErr(err?.response?.data?.message || "Failed to load charities");
      } finally {
        if (!cancelled) setCharBusy(false);
      }
    }
    loadCharities();
    return () => {
      cancelled = true;
    };
  }, []);

  const subscriptionStatus = auth.user?.subscription_status || auth.user?.subscriptionStatus;
  const subscriptionPlan = auth.user?.subscription_plan || auth.user?.subscriptionPlanType;
  const subscriptionStart = auth.user?.subscription_start_date || auth.user?.subscriptionRenewsAt;

  const planLabel = useMemo(() => {
    if (!subscriptionPlan) return "—";
    return subscriptionPlan === "yearly" ? "Yearly" : subscriptionPlan === "monthly" ? "Monthly" : subscriptionPlan;
  }, [subscriptionPlan]);

  async function onSaveSettings() {
    setSaveBusy(true);
    setSaveMsg("");
    setSaveErr("");
    try {
      if (!selectedCharityId) {
        setSaveErr("Please choose a charity.");
        return;
      }
      await api.post("/charities/select", {
        charityId: selectedCharityId,
        contributionPercent: contributionPercent
      });
      await auth.refreshUser();
      setSaveMsg("Saved. Your charity selection is updated.");
    } catch (err) {
      setSaveErr(err?.response?.data?.message || "Failed to update settings");
    } finally {
      setSaveBusy(false);
    }
  }

  async function onChangePassword(e) {
    e.preventDefault();
    setPwdBusy(true);
    setPwdMsg("");
    setPwdErr("");
    try {
      if (!pwdOld || !pwdNew) {
        setPwdErr("Old and new passwords are required.");
        return;
      }
      await api.post("/auth/change-password", { oldPassword: pwdOld, newPassword: pwdNew });
      setPwdMsg("Password updated.");
      setPwdOld("");
      setPwdNew("");
    } catch (err) {
      setPwdErr(err?.response?.data?.message || "Failed to change password");
    } finally {
      setPwdBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-sm text-slate-400">Profile</div>
            <div className="text-lg font-semibold text-white">Account settings</div>
          </div>
          <div className="text-xs text-slate-500">
            Member since {auth.user?.createdAt ? new Date(auth.user.createdAt).toLocaleDateString() : "—"}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-xs text-slate-400">Email</div>
            <div className="mt-1 font-semibold">{auth.user?.email || "—"}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-xs text-slate-400">Subscription</div>
            <div className="mt-1 font-semibold">
              {planLabel}{" "}
              <span className="text-emerald-200 text-sm font-medium">
                ({subscriptionStatus || "inactive"})
              </span>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-xs text-slate-400">Selected charity</div>
            <div className="mt-1 font-semibold">{auth.user?.selectedCharity?.name || "Not selected"}</div>
          </div>
        </div>

        <div className="mt-4 text-sm text-slate-400">
          Subscription start:{" "}
          <span className="text-slate-200">
            {subscriptionStart ? new Date(subscriptionStart).toLocaleDateString() : "—"}
          </span>
        </div>

        <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <div className="text-xs text-slate-500">
            Need to switch accounts? You can log out safely from here.
          </div>
          <button
            type="button"
            className="btn w-full sm:w-auto bg-white/5 border border-white/10 hover:bg-white/10"
            onClick={() => {
              auth.logout();
              navigate("/login", { replace: true });
            }}
          >
            Log out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="text-lg font-semibold">Settings</div>
          <div className="text-sm text-slate-400 mt-1">Update your selected charity and donation percentage.</div>

          <div className="mt-4">
            <label className="text-sm text-slate-300">Selected charity</label>
            <select
              value={selectedCharityId}
              onChange={(e) => setSelectedCharityId(e.target.value)}
              className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-emerald-400/60 transition"
              disabled={charBusy}
            >
              <option value="">Choose a charity...</option>
              {charities.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            {charErr ? <div className="mt-2 text-sm text-red-300">{charErr}</div> : null}
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <label className="text-sm text-slate-300">Charity contribution</label>
              <div className="text-xs text-slate-500">{contributionPercent}%</div>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              step={1}
              value={contributionPercent}
              onChange={(e) => setContributionPercent(Number(e.target.value))}
              className="w-full mt-2"
            />
          </div>

          {saveErr ? <div className="mt-3 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-3">{saveErr}</div> : null}
          {saveMsg ? <div className="mt-3 text-sm text-emerald-200 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">{saveMsg}</div> : null}

          <button className="btn btn-primary w-full mt-4 text-slate-950" type="button" onClick={onSaveSettings} disabled={saveBusy}>
            {saveBusy ? "Saving..." : "Save settings"}
          </button>
        </div>

        <div className="card p-5">
          <div className="text-lg font-semibold">Change password</div>
          <div className="text-sm text-slate-400 mt-1">Basic password update (old password required).</div>

          <form onSubmit={onChangePassword} className="mt-4 space-y-4">
            <div>
              <label className="text-sm text-slate-300">Old password</label>
              <input
                type="password"
                value={pwdOld}
                onChange={(e) => setPwdOld(e.target.value)}
                className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-emerald-400/60 transition"
                required
              />
            </div>
            <div>
              <label className="text-sm text-slate-300">New password</label>
              <input
                type="password"
                value={pwdNew}
                onChange={(e) => setPwdNew(e.target.value)}
                className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-emerald-400/60 transition"
                required
                minLength={6}
              />
            </div>

            {pwdErr ? <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-3">{pwdErr}</div> : null}
            {pwdMsg ? <div className="text-sm text-emerald-200 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">{pwdMsg}</div> : null}

            <button className="btn btn-primary w-full text-slate-950" disabled={pwdBusy} type="submit">
              {pwdBusy ? "Updating..." : "Update password"}
            </button>
          </form>

          <div className="mt-4 text-xs text-slate-500">
            Security note: This demo stores passwords using `bcryptjs` hashes.
          </div>
        </div>
      </div>
    </div>
  );
}

