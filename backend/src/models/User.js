const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         name: { type: string }
 *         phone: { type: string }
 *         email: { type: string }
 *         role: { type: string, enum: [customer, restaurant, admin] }
 *         isActive: { type: boolean }
 */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, lowercase: true, sparse: true },
    role: {
      type: String,
      enum: ['customer', 'restaurant', 'admin'],
      default: 'customer',
    },
    isActive: { type: Boolean, default: true },
    profileImage: { type: String },
    fcmToken: { type: String }, // for push notifications
    lastLogin: { type: Date },
    // OTP fields (not persisted long-term)
    otp: { type: String },
    otpExpiry: { type: Date },
    otpAttempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.otp;
  delete obj.otpExpiry;
  delete obj.otpAttempts;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
