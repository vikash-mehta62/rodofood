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
    password: { type: String }, // bcrypt hashed
    role: {
      type: String,
      enum: ['customer', 'restaurant', 'admin'],
      default: 'customer',
    },
    isActive: { type: Boolean, default: true },
    profileImage: { type: String },
    fcmToken: { type: String },
    lastLogin: { type: Date },
    // Email verification
    isEmailVerified: { type: Boolean, default: false },
    emailOtp: { type: String },
    emailOtpExpiry: { type: Date },
    // Password reset
    resetOtp: { type: String },
    resetOtpExpiry: { type: Date },
    // OTP login
    otp: { type: String },
    otpExpiry: { type: Date },
    otpAttempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailOtp;
  delete obj.emailOtpExpiry;
  delete obj.resetOtp;
  delete obj.resetOtpExpiry;
  delete obj.otp;
  delete obj.otpExpiry;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
