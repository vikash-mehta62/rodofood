const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, index: true },
    description: { type: String },
    discountType: { type: String, enum: ['percentage', 'flat'], required: true },
    discountValue: { type: Number, required: true },
    maxDiscountAmount: { type: Number }, // cap for percentage discounts
    minOrderAmount: { type: Number, default: 0 },
    // Scope
    applicableTo: {
      type: String,
      enum: ['all', 'restaurant', 'route'],
      default: 'all',
    },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
    route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
    // Usage limits
    usageLimit: { type: Number }, // total uses allowed
    usageCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },
    // Validity
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Coupon', couponSchema);
