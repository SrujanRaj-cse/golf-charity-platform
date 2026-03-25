const mongoose = require("mongoose");

const ScoreSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    value: { type: Number, required: true, min: 1, max: 45 },
    date: { type: Date, required: true, index: true }
  },
  { timestamps: true }
);

ScoreSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model("Score", ScoreSchema);

