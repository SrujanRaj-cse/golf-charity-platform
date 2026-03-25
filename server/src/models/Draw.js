const mongoose = require("mongoose");

const DrawSchema = new mongoose.Schema(
  {
    numbers: { type: [Number], required: true, validate: (v) => Array.isArray(v) && v.length === 5 },
    logicType: { type: String, enum: ["random", "algorithmic"], default: "random" },

    // Month bucket for "monthly cadence". Stored as first day of month at 00:00 UTC.
    month: { type: Date, required: true, index: true },

    mode: { type: String, enum: ["simulation", "published"], default: "published" },
    status: { type: String, enum: ["draft", "published"], default: "draft" },

    prizePoolTotalCents: { type: Number, default: 0 },
    jackpotCarryoverInCents: { type: Number, default: 0 },
    jackpotTierCents: { type: Number, default: 0 },
    winners5Count: { type: Number, default: 0 },
    winners4Count: { type: Number, default: 0 },
    winners3Count: { type: Number, default: 0 },

    // If there were no 5-match winners, next draw receives this carryover.
    jackpotCarryoverOutCents: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Draw", DrawSchema);

