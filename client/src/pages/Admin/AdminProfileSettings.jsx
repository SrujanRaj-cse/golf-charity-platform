import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../auth/AuthProvider";

export default function AdminProfileSettings() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="text-sm text-slate-400">Admin profile</div>
        <div className="mt-1 text-lg font-semibold text-white">Account</div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-xs text-slate-400">Email</div>
            <div className="mt-1 font-semibold break-words">{auth.user?.email || "—"}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-xs text-slate-400">Role</div>
            <div className="mt-1 font-semibold">admin</div>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <div className="text-xs text-slate-500">
            Admin accounts don’t have subscription plans.
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
    </div>
  );
}

