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
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
