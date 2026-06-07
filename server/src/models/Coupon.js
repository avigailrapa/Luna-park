const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: { type: String, default: '' },
    discountPercent: { type: Number, required: true, min: 1, max: 100 },
    expiresAt: { type: Date, required: true },
    usageLimit: { type: Number, default: null, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    imageUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Coupon', couponSchema);
