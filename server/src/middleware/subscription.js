const User = require("../models/User");

function subscriptionDurationMs(planType) {
  // Simplified simulation-friendly durations.
  // Monthly: 30 days, Yearly: 365 days.
  if (planType === "yearly") return 365 * 24 * 60 * 60 * 1000;
  return 30 * 24 * 60 * 60 * 1000;
}

async function requireActiveSubscription(req, res, next) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Missing auth context" });

  const user = await User.findById(userId).select(
    "subscription_status subscription_plan subscription_start_date subscriptionStatus subscriptionPlanType subscriptionRenewsAt subscriptionPlanType"
  );
  if (!user) return res.status(401).json({ message: "User not found" });

  const now = Date.now();

  const effectiveStatus = user.subscription_status || user.subscriptionStatus || "inactive";
  const effectivePlan = user.subscription_plan || user.subscriptionPlanType;
  const startDate = user.subscription_start_date || null;

  // New-model eligibility (subscription_start_date + plan duration).
  if (effectiveStatus === "active" && startDate && effectivePlan) {
    const expiresAtMs = new Date(startDate).getTime() + subscriptionDurationMs(effectivePlan);
    if (expiresAtMs < now) {
      await User.updateOne({ _id: userId }, { subscription_status: "expired", subscriptionStatus: "expired" });
      user.subscription_status = "expired";
    }
  }

  // Legacy fallback eligibility (subscriptionRenewsAt).
  if (effectiveStatus === "active" && user.subscriptionRenewsAt && user.subscriptionRenewsAt.getTime() < now) {
    await User.updateOne({ _id: userId }, { subscription_status: "expired", subscriptionStatus: "expired" });
    user.subscription_status = "expired";
  }

  if (effectiveStatus !== "active") {
    return res.status(403).json({
      message: "Active subscription required",
      subscriptionStatus: effectiveStatus,
      subscriptionPlanType: effectivePlan || user.subscriptionPlanType,
      subscriptionRenewsAt: user.subscriptionRenewsAt || null
    });
  }

  // Compute a normalized "active" view for downstream handlers.
  req.subscription = user;
  return next();
}

module.exports = { requireActiveSubscription };

