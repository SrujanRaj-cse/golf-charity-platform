const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    // If targetUserId is set, it is user-specific. Otherwise it targets a group (e.g. subscribers).
    targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    target: { type: String, enum: ["user", "subscribers", "all"], default: "subscribers" },
    kind: {
      type: String,
      enum: ["draw_result", "winner_announcement", "event"],
      default: "draw_result"
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, default: "" },
    payload: { type: Object, default: {} },
    status: { type: String, enum: ["unread", "read"], default: "unread" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema);

