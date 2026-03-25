const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const { env } = require("../config/env");

const User = require("../models/User");
const Score = require("../models/Score");
const Charity = require("../models/Charity");
const Draw = require("../models/Draw");
const Winner = require("../models/Winner");
const DrawEntry = require("../models/DrawEntry");

const { requireAuth } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");
const { requireActiveSubscription } = require("../middleware/subscription");

const router = express.Router();

function subscriptionDurationMs(planType) {
  // Simplified simulation-friendly durations.
  // Monthly: 30 days, Yearly: 365 days.
  if (planType === "yearly") return 365 * 24 * 60 * 60 * 1000;
  return 30 * 24 * 60 * 60 * 1000;
}

function isUserSubscriptionActive(user) {
  const effectiveStatus = user.subscription_status || user.subscriptionStatus || "inactive";
  const effectivePlan = user.subscription_plan || user.subscriptionPlanType;

  // New-model check: start date + duration.
  if (effectiveStatus === "active" && user.subscription_start_date && effectivePlan) {
    const startMs = new Date(user.subscription_start_date).getTime();
    const expiresAtMs = startMs + subscriptionDurationMs(effectivePlan);
    return expiresAtMs >= Date.now();
  }

  // Legacy fallback.
  if (effectiveStatus === "active" && user.subscriptionRenewsAt) {
    return new Date(user.subscriptionRenewsAt).getTime() >= Date.now();
  }

  return false;
}

function enforceLatestFive(userId) {
  return Score.find({ userId }).sort({ date: -1, _id: -1 }).select("_id").then((all) => {
    if (all.length <= 5) return;
    const toDelete = all.slice(5).map((d) => d._id);
    return Score.deleteMany({ _id: { $in: toDelete } });
  });
}

const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (_req, file, cb) {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    cb(null, unique + "-" + safe);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: function (_req, file, cb) {
    if (!file.mimetype.startsWith("image/")) return cb(new Error("Only image uploads are allowed"));
    cb(null, true);
  }
});

router.get("/users", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const users = await User.find({})
      .select(
        "email role subscription_status subscription_plan subscription_start_date subscriptionStatus subscriptionPlanType subscriptionRenewsAt createdAt selectedCharityId charityContributionPercent"
      )
      .sort({ createdAt: -1 });
    return res.json({ users });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch users" });
  }
});

// Reports & analytics for admin dashboard
router.get("/analytics", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const [totalUsers, publishedDrawCount] = await Promise.all([
      User.countDocuments({}),
      Draw.countDocuments({ mode: "published" })
    ]);

    const publishedDrawIds = await Draw.find({ mode: "published" })
      .select("_id")
      .lean()
      .then((docs) => docs.map((d) => d._id));

    const totalPrizePoolCentsAgg = await Draw.aggregate([
      { $match: { mode: "published" } },
      { $group: { _id: null, total: { $sum: "$prizePoolTotalCents" } } }
    ]);
    const totalPrizePoolCents = totalPrizePoolCentsAgg[0]?.total || 0;

    const [participantsCount, winnersCount, winnersByTier] = await Promise.all([
      DrawEntry.countDocuments({ drawId: { $in: publishedDrawIds } }),
      Winner.countDocuments({ drawId: { $in: publishedDrawIds } }),
      Winner.aggregate([
        { $match: { drawId: { $in: publishedDrawIds } } },
        { $group: { _id: "$matchCount", count: { $sum: 1 } } }
      ])
    ]);

    const winners5Count = winnersByTier.find((x) => x._id === 5)?.count || 0;
    const winners4Count = winnersByTier.find((x) => x._id === 4)?.count || 0;
    const winners3Count = winnersByTier.find((x) => x._id === 3)?.count || 0;

    // Charity contribution totals based on active subscribers.
    const candidateUsers = await User.find({}).select(
      "subscription_status subscription_plan subscription_start_date subscriptionStatus subscriptionPlanType subscriptionRenewsAt selectedCharityId charityContributionPercent"
    ).lean();

    const activeUsers = candidateUsers.filter((u) => isUserSubscriptionActive(u) && u.selectedCharityId);

    const charityIds = Array.from(new Set(activeUsers.map((u) => String(u.selectedCharityId))));
    const charities = charityIds.length
      ? await Charity.find({ _id: { $in: charityIds } }).select("name").lean()
      : [];
    const charityNameById = new Map(charities.map((c) => [String(c._id), c.name]));

    const charityTotalsById = new Map();
    for (const u of activeUsers) {
      const plan = u.subscription_plan || u.subscriptionPlanType;
      const priceCents = plan === "yearly" ? env.planYearlyPriceCents : env.planMonthlyPriceCents;
      const percent = Number(u.charityContributionPercent || 10);
      const donatedCents = Math.round(priceCents * (percent / 100));

      const id = String(u.selectedCharityId);
      const prev = charityTotalsById.get(id) || 0;
      charityTotalsById.set(id, prev + donatedCents);
    }

    const charityContributionTotals = Array.from(charityTotalsById.entries()).map(([charityId, totalCents]) => ({
      charityId,
      charityName: charityNameById.get(charityId) || "Unknown charity",
      totalCents
    }));

    return res.json({
      totalUsers,
      activeSubscribers: activeUsers.length,
      totalPrizePoolCents,
      charityContributionTotals,
      drawStats: {
        publishedDrawCount,
        participantsCount,
        winnersCount,
        winners5Count,
        winners4Count,
        winners3Count
      }
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch analytics" });
  }
});

// Manage subscriptions (simulation-friendly)
router.patch("/users/:userId/subscription", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, planType } = req.body || {};

    const allowedStatuses = ["active", "inactive", "expired"];
    if (!allowedStatuses.includes(status)) return res.status(400).json({ message: "status must be active|inactive|expired" });

    const allowedPlans = ["monthly", "yearly"];
    if (status === "active" && !allowedPlans.includes(planType)) {
      return res.status(400).json({ message: "planType must be monthly or yearly when activating" });
    }

    const now = new Date();
    const monthsToAdd = planType === "yearly" ? 12 : 1;
    const renewAt = new Date(now);
    renewAt.setUTCMonth(renewAt.getUTCMonth() + monthsToAdd);

    const update = {};
    if (status === "active") {
      update.subscription_status = "active";
      update.subscription_plan = planType;
      update.subscription_start_date = now;

      // legacy
      update.subscriptionStatus = "active";
      update.subscriptionPlanType = planType;
      update.subscriptionRenewsAt = renewAt;
    } else if (status === "inactive") {
      update.subscription_status = "inactive";
      update.subscription_plan = null;
      update.subscription_start_date = null;

      update.subscriptionStatus = "inactive";
      update.subscriptionPlanType = null;
      update.subscriptionRenewsAt = null;
    } else {
      update.subscription_status = "expired";
      update.subscription_plan = planType || null;
      update.subscription_start_date = null;

      update.subscriptionStatus = "expired";
      update.subscriptionPlanType = planType || null;
      update.subscriptionRenewsAt = null;
    }

    await User.updateOne({ _id: userId }, { $set: update });
    return res.json({ message: "Subscription updated" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update subscription" });
  }
});

router.get("/users/:userId/scores", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const scores = await Score.find({ userId }).sort({ date: -1, _id: -1 }).limit(5).select("_id value date");
    return res.json({ scores });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch scores" });
  }
});

router.get("/winners", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const winners = await Winner.find({})
      .sort({ createdAt: -1 })
      .limit(200)
      .populate("userId", "email role")
      .populate("drawId", "month numbers");

    return res.json({ winners });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch winners" });
  }
});

router.post("/winners/:winnerId/proof", requireAuth, requireActiveSubscription, upload.single("proof"), async (req, res) => {
  try {
    const { winnerId } = req.params;
    const winner = await Winner.findById(winnerId);
    if (!winner) return res.status(404).json({ message: "Winner not found" });
    if (String(winner.userId) !== String(req.user.id)) return res.status(403).json({ message: "Not allowed" });

    if (winner.verificationStatus !== "pending") {
      return res.status(409).json({ message: "Winner proof already submitted" });
    }

    if (!req.file) return res.status(400).json({ message: "proof image is required" });
    const proofUrl = `/uploads/${req.file.filename}`;

    winner.proofUrl = proofUrl;
    await winner.save();

    return res.json({ message: "Proof uploaded", proofUrl });
  } catch (err) {
    return res.status(500).json({ message: "Failed to upload proof" });
  }
});

router.patch("/winners/:winnerId/verification", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { winnerId } = req.params;
    const { verificationStatus, adminNotes } = req.body || {};

    if (!["approved", "rejected"].includes(verificationStatus)) {
      return res.status(400).json({ message: "verificationStatus must be approved or rejected" });
    }

    const winner = await Winner.findById(winnerId);
    if (!winner) return res.status(404).json({ message: "Winner not found" });

    winner.verificationStatus = verificationStatus;
    winner.adminNotes = adminNotes || "";
    winner.verifiedAt = verificationStatus === "approved" ? new Date() : null;
    await winner.save();

    return res.json({ message: "Verification updated" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update verification" });
  }
});

router.patch("/winners/:winnerId/payout", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { winnerId } = req.params;
    const { payoutStatus } = req.body || {};

    if (!["paid", "pending"].includes(payoutStatus)) {
      return res.status(400).json({ message: "payoutStatus must be paid or pending" });
    }

    const winner = await Winner.findById(winnerId);
    if (!winner) return res.status(404).json({ message: "Winner not found" });

    winner.payoutStatus = payoutStatus;
    winner.paidAt = payoutStatus === "paid" ? new Date() : null;
    await winner.save();

    return res.json({ message: "Payout updated" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update payout" });
  }
});

// Charity CRUD (admin)
router.get("/charities", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const charities = await Charity.find({})
      .select("name description imageUrl images isSpotlight upcomingEvents")
      .sort({ isSpotlight: -1, name: 1 })
      .limit(500);
    return res.json({ charities });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch charities" });
  }
});

router.post("/charities", requireAuth, requireAdmin, upload.array("images", 6), async (req, res) => {
  try {
    const { name, description, imageUrl, isSpotlight } = req.body || {};
    if (!name) return res.status(400).json({ message: "name is required" });

    const uploadedImages = Array.isArray(req.files) ? req.files.map((f) => `/uploads/${f.filename}`) : [];
    const normalizedLegacyImageUrls = imageUrl ? [String(imageUrl)] : [];
    const images = uploadedImages.length ? uploadedImages : normalizedLegacyImageUrls;

    // Optional single upcoming event (admin convenience).
    const eventTitle = req.body?.eventTitle;
    const eventDate = req.body?.eventDate;
    const eventDescription = req.body?.eventDescription || "";
    const upcomingEvents =
      eventTitle && eventDate
        ? [
            {
              title: String(eventTitle),
              date: new Date(eventDate),
              description: String(eventDescription)
            }
          ]
        : [];

    const charity = await Charity.create({
      name,
      description: description || "",
      imageUrl: imageUrl || "",
      images,
      isSpotlight: Boolean(isSpotlight === true || isSpotlight === "true"),
      upcomingEvents
    });

    return res.status(201).json({ charity });
  } catch (err) {
    return res.status(500).json({ message: "Failed to create charity" });
  }
});

router.put("/charities/:id", requireAuth, requireAdmin, upload.array("images", 6), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, imageUrl, isSpotlight } = req.body || {};

    const charity = await Charity.findById(id);
    if (!charity) return res.status(404).json({ message: "Charity not found" });

    if (name !== undefined) charity.name = name;
    if (description !== undefined) charity.description = description;

    const uploadedImages = Array.isArray(req.files) ? req.files.map((f) => `/uploads/${f.filename}`) : [];
    if (uploadedImages.length) charity.images = uploadedImages;
    if (imageUrl !== undefined) charity.imageUrl = imageUrl;

    if (isSpotlight !== undefined) charity.isSpotlight = Boolean(isSpotlight === true || isSpotlight === "true");

    // Optional single upcoming event (if provided, replace upcomingEvents with one item).
    const eventTitle = req.body?.eventTitle;
    const eventDate = req.body?.eventDate;
    const eventDescription = req.body?.eventDescription;
    if (eventTitle && eventDate) {
      const dt = new Date(eventDate);
      if (Number.isNaN(dt.getTime())) {
        return res.status(400).json({ message: "Invalid eventDate" });
      }
      charity.upcomingEvents = [
        {
          title: String(eventTitle),
          date: dt,
          description: String(eventDescription || "")
        }
      ];
    }

    await charity.save();
    return res.json({ message: "Charity updated" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update charity" });
  }
});

router.delete("/charities/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await Charity.findByIdAndDelete(id);
    return res.json({ message: "Charity deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete charity" });
  }
});

module.exports = router;

