const mongoose = require("mongoose");

const WinnerSchema = new mongoose.Schema(
  {
    drawId: { type: mongoose.Schema.Types.ObjectId, ref: "Draw", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    matchCount: { type: Number, required: true, enum: [3, 4, 5] },

    amountCents: { type: Number, required: true, min: 0 },

    // Winner verification flow
    proofUrl: { type: String, default: "" },
    verificationStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    adminNotes: { type: String, default: "" },
    verifiedAt: { type: Date, default: null },

    // Payment flow
    payoutStatus: { type: String, enum: ["pending", "paid"], default: "pending" },
    paidAt: { type: Date, default: null }
  },
  { timestamps: true }
);

WinnerSchema.index({ drawId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("Winner", WinnerSchema);

