import React, { useEffect, useState } from "react";
import api from "../../api/client";

export default function AdminCharities() {
  const [charities, setCharities] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagesFiles, setImagesFiles] = useState([]);
  const [isSpotlight, setIsSpotlight] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventDescription, setEventDescription] = useState("");

  const [editId, setEditId] = useState(null);

  async function load() {
    const res = await api.get("/admin/charities");
    setCharities(res.data.charities || []);
  }

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setBusy(true);
      setError("");
      try {
        await load();
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message || "Failed to load charities");
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setName("");
    setDescription("");
    setImageUrl("");
    setImagesFiles([]);
    setIsSpotlight(false);
    setEventTitle("");
    setEventDate("");
    setEventDescription("");
    setEditId(null);
  }

  async function createCharity(e) {
    e.preventDefault();
    setError("");
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description || "");
      formData.append("imageUrl", imageUrl || "");
      formData.append("isSpotlight", String(isSpotlight));
      if (eventTitle) formData.append("eventTitle", eventTitle);
      if (eventDate) formData.append("eventDate", eventDate);
      if (eventDescription) formData.append("eventDescription", eventDescription);
      Array.from(imagesFiles).forEach((f) => formData.append("images", f));

      await api.post("/admin/charities", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      resetForm();
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create charity");
    }
  }

  async function updateCharity(e) {
    e.preventDefault();
    if (!editId) return;
    setError("");
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description || "");
      formData.append("imageUrl", imageUrl || "");
      formData.append("isSpotlight", String(isSpotlight));
      if (eventTitle) formData.append("eventTitle", eventTitle);
      if (eventDate) formData.append("eventDate", eventDate);
      if (eventDescription) formData.append("eventDescription", eventDescription);
      Array.from(imagesFiles).forEach((f) => formData.append("images", f));

      await api.put(`/admin/charities/${editId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      resetForm();
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update charity");
    }
  }

  async function remove(id) {
    setError("");
    try {
      await api.delete(`/admin/charities/${id}`);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete charity");
    }
  }

  if (busy) return <div className="p-4 text-slate-300">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="text-lg font-semibold">Charity management</div>
        <div className="text-sm text-slate-400 mt-1">Add and organize charities that subscribers can choose.</div>

        {error ? <div className="mt-3 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-3">{error}</div> : null}

        <form onSubmit={editId ? updateCharity : createCharity} className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="text-sm text-slate-300">Name</label>
            <input
              className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-emerald-400/60"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm text-slate-300">Description</label>
            <textarea
              className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-emerald-400/60 text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm text-slate-300">Image URL (optional)</label>
            <input
              className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-emerald-400/60"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm text-slate-300">Upload images (optional)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-emerald-400/60"
              onChange={(e) => setImagesFiles(Array.from(e.target.files || []))}
            />
            <div className="text-xs text-slate-500 mt-1">If you upload images, they will replace existing images.</div>
          </div>

          <div className="sm:col-span-2 flex items-center justify-between gap-3">
            <label className="text-sm text-slate-300 flex items-center gap-2">
              <input type="checkbox" checked={isSpotlight} onChange={(e) => setIsSpotlight(e.target.checked)} />
              Spotlight
            </label>
            <div className="flex gap-2">
              <button className="btn btn-primary text-slate-950" type="submit">
                {editId ? "Save changes" : "Add charity"}
              </button>
              {editId ? (
                <button className="btn" type="button" onClick={resetForm}>
                  Cancel
                </button>
              ) : null}
            </div>
          </div>

          <div className="sm:col-span-1">
            <label className="text-sm text-slate-300">Event title (optional)</label>
            <input
              className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-emerald-400/60"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="e.g. Community Golf Day"
            />
          </div>

          <div className="sm:col-span-1">
            <label className="text-sm text-slate-300">Event date (optional)</label>
            <input
              type="date"
              className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-emerald-400/60"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm text-slate-300">Event description (optional)</label>
            <textarea
              className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-emerald-400/60 text-sm"
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              rows={2}
            />
          </div>
        </form>
      </div>

      <div className="card">
        <div className="text-lg font-semibold">Existing charities</div>
        <div className="text-sm text-slate-400 mt-1">{charities.length} total</div>

        <div className="mt-4 space-y-2">
          {charities.map((c) => (
            <div key={c._id} className="flex items-start justify-between gap-4 p-3 rounded-xl border border-white/10 bg-white/5">
              <div>
                <div className="font-semibold">
                  {c.name} {c.isSpotlight ? <span className="text-emerald-200 text-xs font-medium ml-2">Spotlight</span> : null}
                </div>
                {c.description ? <div className="text-xs text-slate-400 mt-1">{c.description}</div> : null}
              </div>
                <div className="flex gap-2">
                  <button
                    className="btn flex-none bg-white/5 border border-white/10 hover:bg-white/10"
                    type="button"
                    onClick={() => {
                      setEditId(c._id);
                      setName(c.name || "");
                      setDescription(c.description || "");
                      setImageUrl(c.imageUrl || "");
                      setImagesFiles([]);
                      setIsSpotlight(Boolean(c.isSpotlight));
                      const ev = Array.isArray(c.upcomingEvents) && c.upcomingEvents.length ? c.upcomingEvents[0] : null;
                      setEventTitle(ev?.title || "");
                      setEventDate(ev?.date ? new Date(ev.date).toISOString().slice(0, 10) : "");
                      setEventDescription(ev?.description || "");
                    }}
                  >
                    Edit
                  </button>
                  <button className="btn flex-none" type="button" onClick={() => remove(c._id)}>
                    Delete
                  </button>
                </div>
            </div>
          ))}
          {!charities.length ? <div className="text-sm text-slate-500">No charities yet.</div> : null}
        </div>
      </div>
    </div>
  );
}

