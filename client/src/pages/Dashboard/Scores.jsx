import React, { useEffect, useState } from "react";
import api from "../../api/client";

export default function Scores() {
  const [scores, setScores] = useState([]);
  const [busy, setBusy] = useState(true);

  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  async function load() {
    const res = await api.get("/scores");
    setScores(res.data.scores || []);
  }

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        await load();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onAdd(e) {
    e.preventDefault();
    setError("");
    const v = Number(value);
    if (!Number.isFinite(v) || v < 1 || v > 45) {
      setError("Score value must be between 1 and 45.");
      return;
    }

    try {
      // PRD: attach current date automatically on the backend.
      await api.post("/scores", { value: v });
      setValue("");
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to add score");
    }
  }

  async function onDelete(id) {
    try {
      await api.delete(`/scores/${id}`);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete score");
    }
  }

  async function startEdit(s) {
    setEditingId(s.id);
    setEditValue(String(s.value));
  }

  async function cancelEdit() {
    setEditingId(null);
    setError("");
  }

  async function saveEdit() {
    setError("");
    const v = Number(editValue);
    if (!Number.isFinite(v) || v < 1 || v > 45) {
      setError("Score value must be between 1 and 45.");
      return;
    }
    try {
      // PRD: no manual date editing in UI.
      await api.patch(`/scores/${editingId}`, { value: v });
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save score");
    }
  }

  if (busy) return <div className="text-slate-300 p-4">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="text-lg font-semibold">Add / edit your scores</div>
        <div className="text-sm text-slate-400 mt-1">Only the latest 5 scores are kept automatically.</div>

        <form onSubmit={onAdd} className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
          <div>
            <label className="text-sm text-slate-300">Score (1–45)</label>
            <input
              className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-emerald-400/60"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              inputMode="numeric"
              placeholder="e.g. 18"
              required
            />
          </div>
          <div className="sm:pb-1">
            <button className="btn btn-primary w-full text-slate-950" type="submit">
              Add score
            </button>
          </div>
        </form>

        {error ? <div className="mt-3 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-3">{error}</div> : null}
      </div>

      <div className="card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Your latest 5 scores</div>
            <div className="text-sm text-slate-400 mt-1">{scores.length}/5 saved.</div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {scores.map((s) => (
            <div key={s.id} className="bg-white/5 border border-white/10 rounded-xl p-3">
              {editingId === s.id ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="text-xs text-slate-300">Score</label>
                    <input
                      className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-emerald-400/60"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      inputMode="numeric"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <button className="btn btn-primary text-slate-950 flex-1" type="button" onClick={saveEdit}>
                      Save
                    </button>
                    <button className="btn flex-1" type="button" onClick={cancelEdit}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="text-sm text-slate-400">{new Date(s.date).toLocaleDateString()}</div>
                    <div className="text-emerald-200 font-semibold text-xl">{s.value}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn flex-1" type="button" onClick={() => startEdit(s)}>
                      Edit
                    </button>
                    <button className="btn flex-1 bg-white/5 border border-white/10 hover:bg-white/10" type="button" onClick={() => onDelete(s.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {!scores.length ? <div className="text-sm text-slate-500">No scores yet. Add your first score above.</div> : null}
        </div>
      </div>
    </div>
  );
}

