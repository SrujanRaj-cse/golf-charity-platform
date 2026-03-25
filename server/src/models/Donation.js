const mongoose = require("mongoose");

const DonationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    charityId: { type: mongoose.Schema.Types.ObjectId, ref: "Charity", required: true },
    amountCents: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ["successful"], default: "successful" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Donation", DonationSchema);

