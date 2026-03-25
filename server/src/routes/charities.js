const express = require("express");

const Charity = require("../models/Charity");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const spotlightOnly = String(req.query.spotlight || "").toLowerCase() === "true";
    const hasEventsOnly = String(req.query.hasEvents || "").toLowerCase() === "true";

    const filter = {};
    if (spotlightOnly) filter.isSpotlight = true;
    if (hasEventsOnly) filter.upcomingEvents = { $exists: true, $ne: [] };
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } }
      ];
    }

    const charities = await Charity.find(filter)
      .select("name description imageUrl images isSpotlight upcomingEvents")
      .sort({ isSpotlight: -1, name: 1 })
      .limit(50)
      .lean();

    const mapped = charities.map((c) => {
      const images = Array.isArray(c.images) && c.images.length ? c.images : (c.imageUrl ? [c.imageUrl] : []);
      const upcomingEvents = Array.isArray(c.upcomingEvents) ? c.upcomingEvents.slice(0, 2) : [];
      return { ...c, images, upcomingEvents };
    });

    return res.json({ charities: mapped });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch charities" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const charity = await Charity.findById(req.params.id).select(
      "name description imageUrl images isSpotlight upcomingEvents"
    );
    if (!charity) return res.status(404).json({ message: "Charity not found" });

    const images =
      Array.isArray(charity.images) && charity.images.length
        ? charity.images
        : charity.imageUrl
          ? [charity.imageUrl]
          : [];

    const upcomingEvents = Array.isArray(charity.upcomingEvents) ? charity.upcomingEvents : [];

    return res.json({
      charity: {
        ...charity.toObject(),
        images,
        upcomingEvents
      }
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch charity" });
  }
});

// Select and save preferred charity
router.post("/select", requireAuth, async (req, res) => {
  try {
    const { charityId, contributionPercent } = req.body || {};
    if (!charityId) return res.status(400).json({ message: "charityId is required" });

    const charity = await Charity.findById(charityId);
    if (!charity) return res.status(404).json({ message: "Charity not found" });

    const percent = contributionPercent === undefined || contributionPercent === null
      ? 10
      : Number(contributionPercent);

    if (!Number.isFinite(percent) || percent < 10 || percent > 100) {
      return res.status(400).json({ message: "contributionPercent must be between 10 and 100" });
    }

    await User.updateOne(
      { _id: req.user.id },
      { selectedCharityId: charity._id, charityContributionPercent: percent }
    );

    return res.json({ message: "Charity selected" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to save charity selection" });
  }
});

module.exports = router;

