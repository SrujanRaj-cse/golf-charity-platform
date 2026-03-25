const express = require("express");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function addMonths(date, months) {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

function renewalDateForPlan(planType) {
  if (planType === "yearly") return addMonths(new Date(), 12);
  return addMonths(new Date(), 1);
}

router.post("/checkout-session", requireAuth, async (req, res) => {
  try {
    const { planType } = req.body || {};
    if (!["monthly", "yearly"].includes(planType)) return res.status(400).json({ message: "planType must be monthly or yearly" });

    // Simulated payment flow (no real gateway integration required).
    // TODO: Replace this simulated activation with Stripe Checkout later.
    // The UI/UX and data model are already structured to support a real payment flow.
    const now = new Date();
    const renewAt = renewalDateForPlan(planType);

    await User.updateOne(
      { _id: req.user.id },
      {
        subscription_status: "active",
        subscription_plan: planType,
        subscription_start_date: now,

        // Keep legacy fields in sync.
        subscriptionStatus: "active",
        subscriptionPlanType: planType,
        subscriptionRenewsAt: renewAt
      }
    );

    return res.json({ mode: "simulated", message: "Subscription activated", planType, subscriptionStartDate: now.toISOString() });
  } catch (err) {
    return res.status(500).json({ message: "Failed to create checkout session" });
  }
});

// Future: Stripe webhook endpoint would be implemented here.
// router.post("/stripe-webhook", express.raw({ type: "application/json" }), async (req, res) => { ... });

module.exports = router;

