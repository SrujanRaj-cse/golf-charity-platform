import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { AuthContext } from "../auth/AuthProvider";

export default function TopNavbar() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [notifBusy, setNotifBusy] = useState(false);
  const [notifError, setNotifError] = useState("");

  const dropdownRef = useRef(null);

  const unreadCount = useMemo(
    () => notifs.filter((n) => n.status === "unread").length,
    [notifs]
  );

  async function loadNotifications() {
    setNotifBusy(true);
    setNotifError("");
    try {
      const res = await api.get("/notifications/me");
      setNotifs(res.data.notifications || []);
    } catch (err) {
      // If token is invalid, AuthProvider should clear it; keep UX simple here.
      setNotifError(err?.response?.data?.message || "Failed to load notifications");
    } finally {
      setNotifBusy(false);
    }
  }

  useEffect(() => {
    if (!notifOpen) return;
    // Load when opening (mobile-first).
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifOpen]);

  useEffect(() => {
    function onDocClick(e) {
      if (!notifOpen) return;
      const el = dropdownRef.current;
      if (!el) return;
      if (el.contains(e.target)) return;
      setNotifOpen(false);
    }

    function onEsc(e) {
      if (e.key === "Escape") setNotifOpen(false);
    }

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [notifOpen]);

  async function markRead(id) {
    try {
      const looksLikeMongoId = /^[a-f\d]{24}$/i.test(String(id));
      if (!looksLikeMongoId) {
        // Virtual notifications don't exist in DB.
        setNotifs((prev) => prev.map((n) => (n._id === id ? { ...n, status: "read" } : n)));
        return;
      }

      await api.patch(`/notifications/${id}/read`);
      // Update local state without forcing another fetch.
      setNotifs((prev) => prev.map((n) => (n._id === id ? { ...n, status: "read" } : n)));
    } catch (err) {
      // no-op; best-effort.
    }
  }

  return (
    <div className="sticky top-0 z-40 bg-slate-950/60 backdrop-blur border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 md:px-5 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            className="flex items-center gap-2 px-2 py-1 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
            onClick={() => navigate("/dashboard")}
            aria-label="Go to dashboard"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 border border-white/10" />
            <div className="hidden sm:block min-w-0">
              <div className="text-sm font-semibold text-white truncate">Bankas</div>
              <div className="text-xs text-slate-400 truncate">Subscription dashboard</div>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              className="relative btn bg-white/5 hover:bg-white/10 border border-white/10 px-3"
              onClick={() => setNotifOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={notifOpen}
              aria-label="Open notifications"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-slate-200"
                aria-hidden="true"
              >
                <path
                  d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2Z"
                  fill="currentColor"
                />
                <path
                  d="M18 16V11c0-3.1-1.6-5.5-4.5-6.2V4a1.5 1.5 0 0 0-3 0v.8C7.6 5.5 6 7.9 6 11v5l-2 2v1h16v-1l-2-2Z"
                  fill="currentColor"
                  opacity="0.9"
                />
              </svg>
              {unreadCount > 0 ? (
                <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-emerald-400 text-slate-950 text-[11px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              ) : null}
            </button>

            {notifOpen ? (
              <div
                role="menu"
                className={[
                  // Mobile-first: fixed inset panel so it never overflows left/right.
                  "fixed left-3 right-3 top-[64px] mt-2",
                  // Desktop: anchored dropdown.
                  "sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-[360px] sm:max-w-[360px]",
                  "bg-slate-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-w-full"
                ].join(" ")}
              >
                <div className="p-3 border-b border-white/10 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">Notifications</div>
                    <div className="text-xs text-slate-400">
                      {notifBusy ? "Loading..." : `${unreadCount} unread`}
                    </div>
                  </div>
                  <button type="button" className="btn px-3" onClick={() => setNotifOpen(false)}>
                    Close
                  </button>
                </div>

                {notifError ? (
                  <div className="p-3 text-sm text-red-300">{notifError}</div>
                ) : notifBusy ? (
                  <div className="p-3 text-sm text-slate-400">Loading notifications...</div>
                ) : notifs.length ? (
                  <div className="max-h-[60vh] overflow-auto p-2 space-y-2 overscroll-contain">
                    {notifs.map((n) => (
                      <button
                        key={n._id}
                        type="button"
                        role="menuitem"
                        className={`w-full text-left p-3 rounded-xl border transition max-w-full ${
                          n.status === "unread" ? "bg-white/10 border-emerald-400/30" : "bg-white/5 border-white/10"
                        } hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400/30`}
                        onClick={async () => {
                          if (n.status === "unread" && n._id) await markRead(n._id);
                          if (n.link) navigate(n.link);
                          setNotifOpen(false);
                        }}
                      >
                        <div className="flex items-start justify-between gap-3 max-w-full">
                          <div className="min-w-0 max-w-full">
                            <div className="text-sm font-semibold text-white truncate">{n.title}</div>
                            <div className="mt-1 text-xs text-slate-300 break-words whitespace-normal line-clamp-3">
                              {n.message}
                            </div>
                          </div>
                          {n.kind ? (
                            <div className="text-[10px] text-slate-500 whitespace-nowrap mt-1">
                              {n.kind.replaceAll("_", " ")}
                            </div>
                          ) : null}
                        </div>
                        <div className="mt-2 text-[11px] text-slate-500">
                          {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-sm text-slate-400">No notifications yet.</div>
                )}

                <div className="p-3 border-t border-white/10">
                  <button
                    type="button"
                    className="w-full btn"
                    onClick={() => {
                      setNotifOpen(false);
                      navigate("/dashboard/winnings");
                    }}
                  >
                    View draw & rewards
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className="btn bg-white/5 hover:bg-white/10 border border-white/10 px-3"
            onClick={() => navigate("/dashboard/profile")}
            aria-label="Open profile settings"
          >
            <span className="text-slate-200">{auth.user?.email ? auth.user.email.slice(0, 1).toUpperCase() : "U"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

