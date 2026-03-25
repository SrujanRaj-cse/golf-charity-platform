const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

const authRoutes = require("./routes/auth");
const charityRoutes = require("./routes/charities");
const donationRoutes = require("./routes/donations");
const scoreRoutes = require("./routes/scores");
const drawRoutes = require("./routes/draw");
const adminRoutes = require("./routes/admin");
const notificationRoutes = require("./routes/notifications");
const billingRoutes = require("./routes/billing");
const healthRoutes = require("./routes/health");

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  // Stripe webhooks require the raw body for signature verification.
  // Skip JSON parsing for the webhook path to avoid double body consumption.
  app.use((req, res, next) => {
    if (req.path === "/billing/stripe-webhook") return next();
    return express.json({ limit: "2mb" })(req, res, next);
  });
  app.use(morgan("dev"));

  // Serve uploaded winner proofs (local dev friendly).
  app.use("/uploads", express.static(path.join(__dirname, "../../uploads")));

  app.use("/health", healthRoutes);

  app.use("/auth", authRoutes);
  app.use("/charities", charityRoutes);
  app.use("/donations", donationRoutes);
  app.use("/scores", scoreRoutes);
  app.use("/draw", drawRoutes);
  app.use("/admin", adminRoutes);
  app.use("/notifications", notificationRoutes);

  app.use("/billing", billingRoutes);

  return app;
}

module.exports = { createApp };

