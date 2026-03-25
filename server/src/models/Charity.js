const mongoose = require("mongoose");

const CharitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: "" },
    // Legacy single image URL (kept for backward compatibility).
    imageUrl: { type: String, default: "" },
    // PRD: multiple images for a richer charity profile.
    images: { type: [String], default: [] },
    isSpotlight: { type: Boolean, default: false },

    // PRD: upcoming events (e.g., golf days).
    upcomingEvents: [
      {
        title: { type: String, required: true },
        date: { type: Date, required: true },
        description: { type: String, default: "" }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Charity", CharitySchema);

