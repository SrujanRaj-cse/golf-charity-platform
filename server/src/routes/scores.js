const express = require("express");

const Score = require("../models/Score");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

async function enforceLatestFive(userId) {
  const all = await Score.find({ userId }).sort({ date: -1, _id: -1 }).select("_id").lean();
  if (all.length <= 5) return;
  const toDelete = all.slice(5).map((d) => d._id);
  await Score.deleteMany({ _id: { $in: toDelete } });
}

router.use(requireAuth);

// Latest scores (reverse chronological)
router.get("/", async (req, res) => {
  try {
    const scores = await Score.find({ userId: req.user.id })
      .sort({ date: -1, _id: -1 })
      .limit(5)
      .select("_id value date");
    return res.json({
      scores: scores.map((s) => ({ id: s._id, value: s.value, date: s.date }))
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch scores" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { value, date } = req.body || {};
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue < 1 || numericValue > 45) {
      return res.status(400).json({ message: "value must be between 1 and 45" });
    }

    const scoreDate = date ? new Date(date) : new Date();
    if (Number.isNaN(scoreDate.getTime())) return res.status(400).json({ message: "Invalid date" });

    const created = await Score.create({ userId: req.user.id, value: numericValue, date: scoreDate });
    await enforceLatestFive(req.user.id);

    return res.status(201).json({
      score: { id: created._id, value: created.value, date: created.date }
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to create score" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { value, date } = req.body || {};

    const score = await Score.findOne({ _id: id, userId: req.user.id });
    if (!score) return res.status(404).json({ message: "Score not found" });

    if (value !== undefined) {
      const numericValue = Number(value);
      if (!Number.isFinite(numericValue) || numericValue < 1 || numericValue > 45) {
        return res.status(400).json({ message: "value must be between 1 and 45" });
      }
      score.value = numericValue;
    }

    if (date !== undefined) {
      const scoreDate = new Date(date);
      if (Number.isNaN(scoreDate.getTime())) return res.status(400).json({ message: "Invalid date" });
      score.date = scoreDate;
    }

    await score.save();
    await enforceLatestFive(req.user.id);

    return res.json({ message: "Score updated" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update score" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Score.deleteOne({ _id: id, userId: req.user.id });
    if (result.deletedCount === 0) return res.status(404).json({ message: "Score not found" });
    return res.json({ message: "Score deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete score" });
  }
});

module.exports = router;

