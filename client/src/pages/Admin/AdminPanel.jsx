import React, { useContext, useMemo } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthContext } from "../../auth/AuthProvider";
import Sidebar from "../../components/Sidebar.jsx";

import AdminUsers from "./AdminUsers.jsx";
import AdminRunDraw from "./AdminRunDraw.jsx";
import AdminWinners from "./AdminWinners.jsx";
import AdminCharities from "./AdminCharities.jsx";
import AdminAnalytics from "./AdminAnalytics.jsx";
import AdminNotifications from "./AdminNotifications.jsx";

export default function AdminPanel() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const items = useMemo(
    () => [
      { to: "users", label: "Users" },
      { to: "run-draw", label: "Run Draw" },
      { to: "winners", label: "Winners" },
      { to: "charities", label: "Charities" },
      { to: "notifications", label: "Notifications" },
      { to: "analytics", label: "Analytics" }
    ],
    []
  );

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-5 py-6 flex gap-4">
        <Sidebar
          items={items.map((it) => ({ ...it, to: it.to }))}
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

          <Routes>
            <Route path="/" element={<Navigate to="users" replace />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="run-draw" element={<AdminRunDraw />} />
            <Route path="winners" element={<AdminWinners />} />
            <Route path="charities" element={<AdminCharities />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="*" element={<Navigate to="/admin/users" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

