const dotenv = require("dotenv");

dotenv.config();

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function toNumber(v, fallback) {
  if (v === undefined || v === null || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const env = {
  port: toNumber(process.env.PORT, 5000),
  nodeEnv: process.env.NODE_ENV || "development",

  mongodbUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/golf_charity_platform",

  jwtSecret: process.env.JWT_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  stripeEnabled: (process.env.STRIPE_ENABLED || "true").toLowerCase() === "true",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  stripePriceMonthlyId: process.env.STRIPE_PRICE_MONTHLY_ID || "",
  stripePriceYearlyId: process.env.STRIPE_PRICE_YEARLY_ID || "",

  prizePoolPercent: toNumber(process.env.PRIZE_POOL_PERCENT, 0.2),
  planMonthlyPriceCents: toNumber(process.env.PLAN_MONTHLY_PRICE_CENTS, 2500),
  planYearlyPriceCents: toNumber(process.env.PLAN_YEARLY_PRICE_CENTS, 25000),
  clientBaseUrl: process.env.CLIENT_BASE_URL || "http://localhost:5173"
};

if (!env.jwtSecret) {
  // Keep local dev workable; production should always set JWT_SECRET.
  // eslint-disable-next-line no-console
  console.warn("Warning: JWT_SECRET is not set; auth will not work correctly.");
}

module.exports = { env, requireEnv };

