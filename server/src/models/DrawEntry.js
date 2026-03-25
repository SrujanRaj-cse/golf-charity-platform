const mongoose = require("mongoose");

const DrawEntrySchema = new mongoose.Schema(
  {
    drawId: { type: mongoose.Schema.Types.ObjectId, ref: "Draw", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    matchCount: { type: Number, required: true, min: 0, max: 5 }
  },
  { timestamps: true }
);

DrawEntrySchema.index({ drawId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("DrawEntry", DrawEntrySchema);

