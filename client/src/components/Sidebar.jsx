import React from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar({ items, onLogout }) {
  return (
    <aside className="w-64 hidden md:flex flex-col gap-4 p-5">
      <div className="glass p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 border border-white/10" />
          <div className="leading-tight">
            <div className="font-semibold text-white">Bankas</div>
            <div className="text-xs text-slate-400">Golf Charity</div>
          </div>
        </div>
      </div>

      <nav className="glass p-2 flex flex-col gap-1">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            className={({ isActive }) =>
              [
                "px-3 py-2 rounded-xl transition border border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400/30",
                isActive ? "bg-white/10 border-white/10" : "hover:bg-white/5"
              ].join(" ")
            }
          >
            <div className="flex items-center justify-between">
              <span className="text-sm">{it.label}</span>
              {it.badge ? <span className="text-xs text-emerald-300/90">{it.badge}</span> : null}
            </div>
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        onClick={onLogout}
        className="btn bg-white/5 hover:bg-white/10 border border-white/10"
      >
        Log out
      </button>
    </aside>
  );
}

