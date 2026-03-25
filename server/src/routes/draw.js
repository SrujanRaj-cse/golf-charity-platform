const express = require("express");
const { env } = require("../config/env");

const User = require("../models/User");
const Score = require("../models/Score");
const Draw = require("../models/Draw");
const DrawEntry = require("../models/DrawEntry");
const Winner = require("../models/Winner");
const Notification = require("../models/Notification");

const { requireAuth } = require("../middleware/auth");
const { requireAdmin } = require("./../middleware/admin");

const router = express.Router();

function startOfMonthUTC(d) {
  const dt = d instanceof Date ? d : new Date(d);
  return new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), 1, 0, 0, 0, 0));
}

function randomFiveNumbers() {
  const pool = Array.from({ length: 45 }, (_, i) => i + 1);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 5).sort((a, b) => a - b);
}

function algorithmicFiveNumbers(scores, preference = "most") {
  // Weighted sampling without replacement based on score frequency.
  // - preference "most": higher frequency => higher chance
  // - preference "least": lower frequency => higher chance
  const freq = Array.from({ length: 46 }, () => 0); // index 0 unused
  for (const s of scores) {
    const v = Number(s.value);
    if (Number.isFinite(v) && v >= 1 && v <= 45) freq[v] += 1;
  }

  const maxFreq = Math.max(...freq);
  const weightFor = (n) => {
    const c = freq[n];
    if (preference === "least") return (maxFreq - c) + 1;
    return c + 1;
  };

  const chosen = new Set();
  const numbers = [];

  while (numbers.length < 5) {
    let total = 0;
    for (let n = 1; n <= 45; n++) {
      if (!chosen.has(n)) total += weightFor(n);
    }
    if (total <= 0) break;

    let r = Math.random() * total;
    for (let n = 1; n <= 45; n++) {
      if (chosen.has(n)) continue;
      r -= weightFor(n);
      if (r <= 0) {
        chosen.add(n);
        numbers.push(n);
        break;
      }
    }
  }

  // Fallback safety (should not happen)
  if (numbers.length < 5) {
    const remaining = Array.from({ length: 45 }, (_, i) => i + 1).filter((n) => !chosen.has(n));
    while (numbers.length < 5 && remaining.length) {
      numbers.push(remaining.shift());
    }
  }

  return numbers.sort((a, b) => a - b);
}

function monthlyEquivalentPriceCentsForUser(user) {
  const plan = user.subscription_plan || user.subscriptionPlanType;
  if (plan === "yearly") return Math.floor(env.planYearlyPriceCents / 12);
  return env.planMonthlyPriceCents;
}

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

  // Legacy fallback: renew date.
  if (effectiveStatus === "active" && user.subscriptionRenewsAt) {
    return new Date(user.subscriptionRenewsAt).getTime() >= Date.now();
  }

  return false;
}

async function getLatestCarryoverForMonth(month) {
  // Carryover rolls forward from the previous published draw.
  const prev = await Draw.findOne({ month: { $lt: month }, mode: "published" })
    .sort({ month: -1 })
    .select("jackpotCarryoverOutCents");
  return prev ? prev.jackpotCarryoverOutCents || 0 : 0;
}

router.post("/run", requireAuth, requireAdmin, async (req, res) => {
  try {
    const mode = req.body?.mode === "simulation" ? "simulation" : "published";
    const month = req.body?.month ? startOfMonthUTC(req.body.month) : startOfMonthUTC(new Date());
    const logicType = req.body?.logicType === "algorithmic" ? "algorithmic" : "random";

    // Prevent double-publish for the same month in published mode.
    if (mode === "published") {
      const existing = await Draw.findOne({ month, mode: "published" });
      if (existing) return res.status(409).json({ message: "Draw already published for this month" });
    }

    // Admin normally generates 5 numbers; allow override for testing/admin.
    let numbers = null;
    if (Array.isArray(req.body?.numbers)) {
      const raw = req.body.numbers;
      const normalized = raw.map((n) => Number(n)).filter((n) => Number.isFinite(n));
      const unique = Array.from(new Set(normalized));
      if (unique.length !== 5 || unique.some((n) => n < 1 || n > 45)) {
        return res.status(400).json({ message: "numbers must be 5 unique integers in range 1–45" });
      }
      numbers = unique.sort((a, b) => a - b);
    }

    // Subscription eligibility: must be active AND not expired.
    // Supports both the new subscription_* fields and legacy subscriptionStatus fields.
    const candidateUsers = await User.find({
      $or: [{ subscription_status: "active" }, { subscriptionStatus: "active" }]
    })
      .select("_id subscription_status subscription_plan subscription_start_date subscriptionPlanType subscriptionRenewsAt")
      .lean();

    const activeUsers = candidateUsers.filter((u) => isUserSubscriptionActive(u));

    const activeUserIds = activeUsers.map((u) => u._id);
    const activeCount = activeUsers.length;

    const scores = await Score.find({ userId: { $in: activeUserIds } })
      .sort({ date: -1, _id: -1 })
      .lean();

    if (!numbers) {
      if (logicType === "algorithmic") {
        numbers = algorithmicFiveNumbers(scores, "most");
      } else {
        numbers = randomFiveNumbers();
      }
    }

    const scoreByUser = new Map();
    for (const s of scores) {
      const key = String(s.userId);
      if (!scoreByUser.has(key)) scoreByUser.set(key, []);
      if (scoreByUser.get(key).length < 5) scoreByUser.get(key).push(s);
    }

    const totalContributionCents = activeUsers.reduce((sum, u) => sum + monthlyEquivalentPriceCentsForUser(u), 0);
    const prizePoolTotalCents = Math.round(totalContributionCents * env.prizePoolPercent);

    const carryoverInCents = await getLatestCarryoverForMonth(month);

    // Allocate tier shares from the current prize pool; jackpot tier also includes carryover.
    const tier5FromPool = Math.floor(prizePoolTotalCents * 0.4);
    const tier4 = Math.floor(prizePoolTotalCents * 0.35);
    const tier3 = prizePoolTotalCents - tier5FromPool - tier4; // ensures exact cents sum
    const jackpotTierCents = tier5FromPool + carryoverInCents;

    const simulationResults = [];

    for (const u of activeUsers) {
      const uScores = scoreByUser.get(String(u._id)) || [];
      const values = uScores.map((s) => s.value);
      const valueSet = new Set(values);
      const matchCount = numbers.reduce((cnt, n) => (valueSet.has(n) ? cnt + 1 : cnt), 0);
      simulationResults.push({ userId: u._id, matchCount });
    }

    const winners5 = simulationResults.filter((r) => r.matchCount === 5);
    const winners4 = simulationResults.filter((r) => r.matchCount === 4);
    const winners3 = simulationResults.filter((r) => r.matchCount === 3);

    const winners5Count = winners5.length;
    const winners4Count = winners4.length;
    const winners3Count = winners3.length;

    const jackpotCarryoverOutCents = winners5Count === 0 ? jackpotTierCents : 0;

    // Split cents fairly across multiple winners.
    // Any remainder cents are distributed 1-by-1 to the first few winners.
    const winners5List = simulationResults.filter((r) => r.matchCount === 5);
    const winners4List = simulationResults.filter((r) => r.matchCount === 4);
    const winners3List = simulationResults.filter((r) => r.matchCount === 3);

    const base5 = winners5Count === 0 ? 0 : Math.floor(jackpotTierCents / winners5Count);
    const rem5 = winners5Count === 0 ? 0 : jackpotTierCents % winners5Count;
    const base4 = winners4Count === 0 ? 0 : Math.floor(tier4 / winners4Count);
    const rem4 = winners4Count === 0 ? 0 : tier4 % winners4Count;
    const base3 = winners3Count === 0 ? 0 : Math.floor(tier3 / winners3Count);
    const rem3 = winners3Count === 0 ? 0 : tier3 % winners3Count;

    const perWinner5Cents = base5;
    const perWinner4Cents = base4;
    const perWinner3Cents = base3;

    if (mode === "simulation") {
      const winners5Preview = winners5Count === 0
        ? []
        : winners5List.slice(0, 20).map((r, idx) => ({
            userId: r.userId,
            matchCount: 5,
            amountCents: base5 + (idx < rem5 ? 1 : 0)
          }));
      const winners4Preview = winners4Count === 0
        ? []
        : winners4List.slice(0, 20).map((r, idx) => ({
            userId: r.userId,
            matchCount: 4,
            amountCents: base4 + (idx < rem4 ? 1 : 0)
          }));
      const winners3Preview = winners3Count === 0
        ? []
        : winners3List.slice(0, 20).map((r, idx) => ({
            userId: r.userId,
            matchCount: 3,
            amountCents: base3 + (idx < rem3 ? 1 : 0)
          }));

      const perWinnerWithRemainder5 = winners5Count === 0 ? 0 : base5; // summary only
      return res.json({
        mode: "simulation",
        month,
        numbers,
        activeCount,
        prizePoolTotalCents,
        carryoverInCents,
        jackpotCarryoverOutCents,
        winnersPreview: {
          winners5Count,
          winners4Count,
          winners3Count,
          perWinner5Cents: perWinnerWithRemainder5,
          perWinner4Cents: base4,
          perWinner3Cents: base3,
          preview: {
            five: winners5Preview,
            four: winners4Preview,
            three: winners3Preview
          }
        }
      });
    }

    const draw = await Draw.create({
      numbers,
      logicType,
      month,
      mode: "published",
      status: "published",
      prizePoolTotalCents,
      jackpotCarryoverInCents: carryoverInCents,
      jackpotTierCents,
      winners5Count,
      winners4Count,
      winners3Count,
      jackpotCarryoverOutCents
    });

    const drawEntryDocs = simulationResults.map((r) => ({
      drawId: draw._id,
      userId: r.userId,
      matchCount: r.matchCount
    }));
    await DrawEntry.insertMany(drawEntryDocs);

    const winnerDocs = [];
    if (winners5Count > 0) {
      winners5List.forEach((r, idx) => {
        const extra = idx < rem5 ? 1 : 0;
        winnerDocs.push({ drawId: draw._id, userId: r.userId, matchCount: 5, amountCents: base5 + extra });
      });
    }
    if (winners4Count > 0) {
      winners4List.forEach((r, idx) => {
        const extra = idx < rem4 ? 1 : 0;
        winnerDocs.push({ drawId: draw._id, userId: r.userId, matchCount: 4, amountCents: base4 + extra });
      });
    }
    if (winners3Count > 0) {
      winners3List.forEach((r, idx) => {
        const extra = idx < rem3 ? 1 : 0;
        winnerDocs.push({ drawId: draw._id, userId: r.userId, matchCount: 3, amountCents: base3 + extra });
      });
    }

    if (winnerDocs.length) await Winner.insertMany(winnerDocs);

    // Notifications:
    // - One group notification for subscribers about the published draw results.
    // - Winner-specific notifications for matched users.
    // TODO: Hook email/SMS delivery here (draw results + winner alerts) when integrating a provider.
    await Notification.create({
      target: "all",
      targetUserId: null,
      kind: "draw_result",
      title: "Draw results are live",
      message: `The monthly draw for ${month.toLocaleDateString("en-US", { month: "long", year: "numeric" })} has been published.`,
      link: "/dashboard/winnings",
      payload: {
        drawId: String(draw._id),
        winners: { winners5Count, winners4Count, winners3Count }
      }
    });

    if (winnerDocs.length) {
      const winnerNotificationDocs = winnerDocs.slice(0, 200).map((w) => ({
        target: "user",
        targetUserId: w.userId,
        kind: "winner_announcement",
        title: "You are a draw winner",
        message: `You matched ${w.matchCount} numbers and are eligible for a reward.`,
        link: "/dashboard/winnings",
        payload: { drawId: String(draw._id), matchCount: w.matchCount, amountCents: w.amountCents }
      }));
      if (winnerNotificationDocs.length) await Notification.insertMany(winnerNotificationDocs);
    }

    return res.json({
      mode: "published",
      drawId: draw._id,
      month,
      numbers,
      activeCount,
      prizePoolTotalCents,
      carryoverInCents,
      jackpotCarryoverOutCents,
      winners: { winners5Count, winners4Count, winners3Count }
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ message: "Draw run failed" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select(
      "subscription_status subscription_plan subscription_start_date subscriptionStatus subscriptionPlanType subscriptionRenewsAt"
    ).lean();
    const eligible = user ? isUserSubscriptionActive(user) : false;

    const draws = await Draw.find({ mode: "published" })
      .sort({ month: -1 })
      .limit(12)
      .select("_id numbers month");

    const drawIds = draws.map((d) => d._id);

    if (!eligible) {
      const history = draws.map((d) => ({
        drawId: d._id,
        month: d.month,
        numbers: d.numbers,
        matchCount: null,
        winning: null
      }));

      return res.json({
        eligible: false,
        subscriptionStatus: user?.subscription_status || user?.subscriptionStatus || "inactive",
        draws: history
      });
    }

    const entries = await DrawEntry.find({ drawId: { $in: drawIds }, userId })
      .select("drawId matchCount")
      .lean();

    const entryByDraw = new Map(entries.map((e) => [String(e.drawId), e]));

    const winners = await Winner.find({ drawId: { $in: drawIds }, userId })
      .select("_id drawId matchCount amountCents verificationStatus payoutStatus proofUrl")
      .lean();
    const winnerByDraw = new Map(winners.map((w) => [String(w.drawId), w]));

    const history = draws.map((d) => {
      const entry = entryByDraw.get(String(d._id));
      const winner = winnerByDraw.get(String(d._id));
      const matchCount = entry ? entry.matchCount : 0;
      return {
        drawId: d._id,
        month: d.month,
        numbers: d.numbers,
        matchCount,
        winning: winner
          ? {
              winnerId: winner._id,
              matchCount: winner.matchCount,
              amountCents: winner.amountCents,
              verificationStatus: winner.verificationStatus,
              payoutStatus: winner.payoutStatus,
              proofUrl: winner.proofUrl
            }
          : null
      };
    });

    return res.json({ eligible: true, draws: history });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch draw history" });
  }
});

module.exports = router;

