import React, { useContext, useState } from "react";
import api from "../../api/client";
import { AuthContext } from "../../auth/AuthProvider";

export default function AdminNotifications() {
  // Kept for consistency with other admin pages (auth is handled by middleware).
  useContext(AuthContext);

  const [target, setTarget] = useState("subscribers"); // subscribers|all|user
  const [targetUserId, setTargetUserId] = useState("");
  const [kind, setKind] = useState("draw_result");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function publish(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await api.post("/notifications", {
        target,
        targetUserId: target === "user" ? targetUserId : null,
        kind,
        title,
        message,
        link
      });
      setSuccess("Notification published.");
      setTitle("");
      setMessage("");
      setLink("");
      setTargetUserId("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to publish notification");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="text-lg font-semibold">Publish notification</div>
        <div className="text-sm text-slate-400 mt-1">Send updates to subscribers, all users, or a single user.</div>

        {error ? <div className="mt-3 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-3">{error}</div> : null}
        {success ? <div className="mt-3 text-sm text-emerald-200 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">{success}</div> : null}

        <form onSubmit={publish} className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-1">
            <label className="text-sm text-slate-300">Audience</label>
            <select
              className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-emerald-400/60"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            >
              <option value="subscribers">Subscribers</option>
              <option value="all">All users</option>
              <option value="user">Specific user</option>
            </select>
          </div>
          {target === "user" ? (
            <div className="sm:col-span-1">
              <label className="text-sm text-slate-300">User ID</label>
              <input
                className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-emerald-400/60"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                placeholder="MongoDB _id"
                disabled={target !== "user"}
              />
            </div>
          ) : (
            <div className="sm:col-span-1 opacity-80">
              <label className="text-sm text-slate-300">User ID</label>
              <input
                className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-emerald-400/60"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                placeholder="MongoDB _id"
                disabled
              />
            </div>
          )}

          <div className="sm:col-span-1">
            <label className="text-sm text-slate-300">Notification type</label>
            <select
              className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-emerald-400/60"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              <option value="draw_result">Draw results</option>
              <option value="winner_announcement">Winner announcement</option>
              <option value="event">Upcoming event</option>
            </select>
          </div>

          <div className="sm:col-span-1">
            <label className="text-sm text-slate-300">Link (optional)</label>
            <input
              className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-emerald-400/60"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="/dashboard/winnings"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm text-slate-300">Title</label>
            <input
              className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-emerald-400/60"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. New draw is live"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm text-slate-300">Message</label>
            <textarea
              className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-emerald-400/60 text-sm"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              placeholder="Write a short notification message..."
            />
          </div>

          <div className="sm:col-span-2 flex items-center justify-end gap-3">
            <button className="btn btn-primary text-slate-950" type="submit" disabled={busy}>
              {busy ? "Publishing..." : "Publish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

