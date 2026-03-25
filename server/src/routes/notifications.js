const express = require("express");

const Notification = require("../models/Notification");
const { requireAuth } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");

const router = express.Router();

router.get("/me", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Show user-specific notifications + subscriber-group + all.
    let notifications = await Notification.find({
      $or: [
        { target: "all" },
        { target: "subscribers", targetUserId: null },
        { target: "user", targetUserId: userId }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(50);

    // PRD: Upcoming draws/events (virtual notification).
    // We can't rely on stored "event" docs in this demo, so we compute the next monthly draw window.
    const now = new Date();
    const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));
    const nextKey = `virtual-event-${nextMonth.toISOString().slice(0, 7)}`; // YYYY-MM
    const hasVirtualEvent = notifications.some((n) => n.kind === "event" && String(n._id) === nextKey);

    if (!hasVirtualEvent) {
      notifications = [
        {
          _id: nextKey,
          kind: "event",
          status: "unread",
          title: "Next draw is coming",
          message: "Submit/refresh your latest 5 scores to be ready when results publish.",
          link: "/dashboard/scores",
          createdAt: new Date().toISOString()
        },
        ...notifications
      ];
    }

    return res.json({ notifications });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

// Admin publish notifications (single message or group message).
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    // TODO: Extend targets for future campaigns/teams/countries.
    const { target, targetUserId, kind, title, message, link, payload } = req.body || {};

    if (!title) return res.status(400).json({ message: "title is required" });
    if (!message) return res.status(400).json({ message: "message is required" });

    const doc = await Notification.create({
      target: target || "subscribers",
      targetUserId: targetUserId || null,
      kind: kind || "draw_result",
      title: String(title),
      message: String(message),
      link: link ? String(link) : "",
      payload: payload && typeof payload === "object" ? payload : {},
    });

    return res.status(201).json({ notification: doc });
  } catch (err) {
    return res.status(500).json({ message: "Failed to publish notification" });
  }
});

router.patch("/:id/read", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.updateOne(
      { _id: id, $or: [{ targetUserId: req.user.id }, { targetUserId: null }] },
      { $set: { status: "read" } }
    );
    return res.json({ message: "Marked as read" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to mark as read" });
  }
});

module.exports = router;

