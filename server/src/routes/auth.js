const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const { env } = require("../config/env");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { email: user.email, role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn, subject: user._id.toString() }
  );
}

router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });
    if (typeof password !== "string" || password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

    const emailNorm = String(email).trim().toLowerCase();
    const exists = await User.findOne({ email: emailNorm });
    if (exists) return res.status(409).json({ message: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 10);

    const adminEmailList = (process.env.ADMIN_EMAIL || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    // Dev bootstrap: if no admin exists yet and no ADMIN_EMAIL is configured,
    // make the first signup an admin to enable admin draw/testing.
    let isAdmin = adminEmailList.includes(emailNorm);
    if (!isAdmin && adminEmailList.length === 0) {
      const existingAdmins = await User.countDocuments({ role: "admin" });
      if (existingAdmins === 0) isAdmin = true;
    }

    const user = await User.create({
      email: emailNorm,
      passwordHash,
      role: isAdmin ? "admin" : "subscriber"
    });

    const token = signToken(user);
    return res.status(201).json({ token });
  } catch (err) {
    return res.status(500).json({ message: "Signup failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const emailNorm = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: emailNorm });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken(user);
    return res.json({ token });
  } catch (err) {
    return res.status(500).json({ message: "Login failed" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("selectedCharityId", "name description imageUrl isSpotlight")
      .select(
        "email role subscription_status subscription_plan subscription_start_date subscriptionStatus subscriptionPlanType subscriptionRenewsAt selectedCharityId charityContributionPercent"
      );

    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        subscription_status: user.subscription_status || user.subscriptionStatus,
        subscription_plan: user.subscription_plan || user.subscriptionPlanType,
        subscription_start_date: user.subscription_start_date || user.subscriptionRenewsAt,

        // Legacy fields (kept so older UI code doesn't break)
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlanType: user.subscriptionPlanType,
        subscriptionRenewsAt: user.subscriptionRenewsAt,
        selectedCharity: user.selectedCharityId,
        charityContributionPercent: user.charityContributionPercent
      }
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch user profile" });
  }
});

// Basic password change (PRD settings page).
router.post("/change-password", requireAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body || {};
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "oldPassword and newPassword are required" });
    }
    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return res.status(400).json({ message: "newPassword must be at least 6 characters" });
    }

    const user = await User.findById(req.user.id).select("passwordHash");
    if (!user) return res.status(404).json({ message: "User not found" });

    const ok = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Old password is incorrect" });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ message: "Password updated" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to change password" });
  }
});

module.exports = router;

