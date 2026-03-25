import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../auth/AuthProvider";
import TopNavbar from "./TopNavbar.jsx";

// Thin wrapper to reuse the notification bell UX while routing admin to admin pages.
export default function AdminTopNavbar() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  // Reuse TopNavbar visuals/behavior but override the two navigation actions by rendering
  // a small admin header bar above it. This avoids duplicating the dropdown logic.
  return (
    <div>
      <div className="sticky top-0 z-50 bg-slate-950/70 backdrop-blur border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-5 py-2 flex items-center justify-between gap-3">
          <button
            type="button"
            className="text-left"
            onClick={() => navigate("/admin/users")}
          >
            <div className="text-xs text-slate-400">Admin</div>
            <div className="text-sm font-semibold text-white truncate max-w-[70vw]">
              {auth.user?.email || "Admin"}
            </div>
          </button>
          <button
            type="button"
            className="btn bg-white/5 hover:bg-white/10 border border-white/10 px-3"
            onClick={() => navigate("/admin/profile")}
          >
            Profile
          </button>
        </div>
      </div>
      <TopNavbar />
    </div>
  );
}

