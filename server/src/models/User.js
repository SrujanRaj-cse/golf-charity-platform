const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },

    role: { type: String, enum: ["subscriber", "admin"], default: "subscriber" },

    // PRD / new canonical subscription fields
    subscription_status: {
      type: String,
      enum: ["inactive", "active", "expired"],
      default: "inactive"
    },
    subscription_plan: { type: String, enum: ["monthly", "yearly"], default: null },
    subscription_start_date: { type: Date, default: null },

    // Legacy fields (kept for backward compatibility with existing documents/code paths)
    subscriptionStatus: {
      type: String,
      enum: ["inactive", "active", "expired"],
      default: "inactive"
    },
    subscriptionPlanType: { type: String, enum: ["monthly", "yearly"], default: null },
    subscriptionRenewsAt: { type: Date, default: null },

    stripeCustomerId: { type: String, default: null },
    stripeSubscriptionId: { type: String, default: null },

    selectedCharityId: { type: mongoose.Schema.Types.ObjectId, ref: "Charity", default: null },
    charityContributionPercent: { type: Number, default: 10, min: 10, max: 100 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);

