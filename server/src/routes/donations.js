const express = require("express");

const Donation = require("../models/Donation");
const Charity = require("../models/Charity");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Independent donation: no subscription gating (PRD).
router.post("/", requireAuth, async (req, res) => {
  try {
    const { charityId, amountCents } = req.body || {};
    if (!charityId) return res.status(400).json({ message: "charityId is required" });
    if (!amountCents) return res.status(400).json({ message: "amountCents is required" });

    const amt = Number(amountCents);
    if (!Number.isFinite(amt) || amt < 1) return res.status(400).json({ message: "Invalid amount" });

    const charity = await Charity.findById(charityId);
    if (!charity) return res.status(404).json({ message: "Charity not found" });

    const donation = await Donation.create({
      userId: req.user.id,
      charityId,
      amountCents: amt,
      status: "successful"
    });

    return res.status(201).json({ donation });
  } catch (err) {
    return res.status(500).json({ message: "Failed to create donation" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const donations = await Donation.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("charityId", "name imageUrl isSpotlight")
      .lean();

    return res.json({ donations });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch donations" });
  }
});

module.exports = router;

