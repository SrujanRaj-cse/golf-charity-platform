import React, { useContext, useMemo } from "react";
import { NavLink, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthContext } from "../../auth/AuthProvider";
import Sidebar from "../../components/Sidebar.jsx";
import AdminTopNavbar from "../../components/AdminTopNavbar.jsx";

import AdminUsers from "./AdminUsers.jsx";
import AdminRunDraw from "./AdminRunDraw.jsx";
import AdminWinners from "./AdminWinners.jsx";
import AdminCharities from "./AdminCharities.jsx";
import AdminAnalytics from "./AdminAnalytics.jsx";
import AdminNotifications from "./AdminNotifications.jsx";
import AdminProfileSettings from "./AdminProfileSettings.jsx";

export default function AdminPanel() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const items = useMemo(
    () => [
      { to: "/admin/users", label: "Users" },
      { to: "/admin/run-draw", label: "Run Draw" },
      { to: "/admin/winners", label: "Winners" },
      { to: "/admin/charities", label: "Charities" },
      { to: "/admin/notifications", label: "Notifications" },
      { to: "/admin/analytics", label: "Analytics" },
      { to: "/admin/profile", label: "Profile" }
    ],
    []
  );

  return (
    <div className="min-h-screen">
      <AdminTopNavbar />

      <div className="max-w-7xl mx-auto px-4 md:px-5 pt-4 pb-6 flex gap-4">
        <Sidebar
          items={items}
          onLogout={() => {
            auth.logout();
            navigate("/login", { replace: true });
          }}
        />

        <main className="flex-1 min-w-0">
          <div className="glass p-4 md:p-5 mb-4 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-sm text-slate-400">Admin panel</div>
              <div className="text-lg font-semibold text-white">Welcome, {auth.user?.email}</div>
            </div>
            <div className="text-xs px-3 py-1 rounded-full border border-white/10 bg-white/5 text-slate-200">
              Manage users, draws & winners
            </div>
          </div>

          <nav className="md:hidden mb-4 flex gap-2 overflow-x-auto pb-1">
            {items.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                className={({ isActive }) =>
                  [
                    "whitespace-nowrap px-3 py-2 rounded-xl border transition text-sm",
                    isActive ? "bg-white/10 border-white/10" : "bg-white/5 border-white/10 hover:bg-white/10"
                  ].join(" ")
                }
              >
                {it.label}
              </NavLink>
            ))}
          </nav>

          <Routes>
            <Route index element={<Navigate to="/admin/users" replace />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="run-draw" element={<AdminRunDraw />} />
            <Route path="winners" element={<AdminWinners />} />
            <Route path="charities" element={<AdminCharities />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="profile" element={<AdminProfileSettings />} />
            <Route path="*" element={<Navigate to="/admin/users" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

