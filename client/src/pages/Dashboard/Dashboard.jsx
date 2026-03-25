import React, { useContext, useMemo } from "react";
import { NavLink, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthContext } from "../../auth/AuthProvider";
import Sidebar from "../../components/Sidebar.jsx";
import TopNavbar from "../../components/TopNavbar.jsx";

import Overview from "./Overview.jsx";
import Scores from "./Scores.jsx";
import Charity from "./Charity.jsx";
import Winnings from "./Winnings.jsx";
import ProfileSettings from "./ProfileSettings.jsx";

export default function Dashboard() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const items = useMemo(
    () => [
      { to: "", label: "Overview", end: true },
      { to: "scores", label: "Scores" },
      { to: "charity", label: "Charity" },
      { to: "winnings", label: "Winnings" },
      { to: "profile", label: "Profile & Settings" }
    ],
    []
  );

  return (
    <div className="min-h-screen">
      <TopNavbar />

      <div className="max-w-7xl mx-auto px-4 md:px-5 pt-4 pb-6 flex gap-4">
        <Sidebar
          items={items}
          onLogout={() => {
            auth.logout();
            navigate("/login", { replace: true });
          }}
        />

        <main className="flex-1 min-w-0">
          <div className="glass p-4 md:p-5 mb-4 flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
            <div>
              <div className="text-sm text-slate-400">Dashboard</div>
              <div className="text-lg font-semibold text-white">{auth.user?.email || "User"}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs px-3 py-1 rounded-full border border-white/10 bg-white/5 text-slate-200">
                {(auth.user?.subscription_status || auth.user?.subscriptionStatus) === "active"
                  ? "Subscribed"
                  : "Free plan (upgrade for draw)"}
              </div>
            </div>
          </div>

          <nav className="md:hidden mb-4 flex gap-2 overflow-x-auto pb-1">
            {items.map((it) => {
              const path = it.to === "" ? "/dashboard" : `/dashboard/${it.to}`;
              return (
                <NavLink
                  key={it.to}
                  to={path}
                  end={it.end}
                  className={({ isActive }) =>
                    [
                      "whitespace-nowrap px-3 py-2 rounded-xl border transition text-sm",
                      isActive ? "bg-white/10 border-white/10" : "bg-white/5 border-white/10 hover:bg-white/10"
                    ].join(" ")
                  }
                >
                  {it.label}
                </NavLink>
              );
            })}
          </nav>

          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="scores" element={<Scores />} />
            <Route path="charity" element={<Charity />} />
            <Route path="winnings" element={<Winnings />} />
            <Route path="profile" element={<ProfileSettings />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

