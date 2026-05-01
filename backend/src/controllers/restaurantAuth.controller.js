const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const { generateOTP, sendOTP, OTP_EXPIRY_MINUTES } = require('../utils/otpService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

/**
 * Send OTP for restaurant registration
 * Same as auth sendOtp but dedicated endpoint
 */
exports.sendOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;

    let user = await User.findOne({ phone });

    if (user && user.otpAttempts >= 3 && user.otpExpiry > new Date()) {
      return errorResponse(res, 'Too many OTP requests. Please wait 10 minutes.', 429);
    }

    // If existing restaurant — check portal access before sending OTP
    if (user && user.role === 'restaurant') {
      const restaurant = await Restaurant.findOne({ owner: user._id }).select('portalEnabled isActive');
      if (restaurant) {
        if (!restaurant.isActive) {
          return errorResponse(res, 'Your restaurant has been deactivated. Please contact support.', 403);
        }
        if (restaurant.portalEnabled === false) {
          return errorResponse(res, 'Your restaurant portal access has been disabled by admin. Please contact support.', 403);
        }
      }
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    if (!user) {
      user = await User.create({ phone, otp, otpExpiry, otpAttempts: 1, role: 'restaurant' });
    } else {
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      // Pre-set role to restaurant so it's ready
      if (user.role === 'customer') user.role = 'restaurant';
      await user.save();
    }

    await sendOTP(phone, otp);

    const responseData = process.env.NODE_ENV === 'development'
      ? { phone, devOtp: otp }
      : { phone };

    return successResponse(res, responseData, 'OTP sent successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Verify OTP for restaurant — always sets role=restaurant
 */
exports.verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    const user = await User.findOne({ phone });
    if (!user) return errorResponse(res, 'User not found. Please request OTP first.', 404);

    if (!user.otp || user.otp !== otp) {
      return errorResponse(res, 'Invalid OTP.', 400);
    }

    if (user.otpExpiry < new Date()) {
      return errorResponse(res, 'OTP has expired. Please request a new one.', 400);
    }

    // Always set restaurant role
    user.role = 'restaurant';
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.otpAttempts = 0;
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);
    const isNewUser = !user.name;

    // Always check portal access — new users won't have a restaurant yet (allowed through)
    // Existing restaurant owners must have portal enabled
    const restaurant = await Restaurant.findOne({ owner: user._id }).select('portalEnabled isActive');
    if (restaurant) {
      if (!restaurant.isActive) {
        return errorResponse(res, 'Your restaurant has been deactivated. Please contact support.', 403);
      }
      if (restaurant.portalEnabled !== true && restaurant.portalEnabled !== undefined) {
        return errorResponse(res, 'Your restaurant portal access has been disabled by admin. Please contact support.', 403);
      }
    }

    return successResponse(
      res,
      { token, user, isNewUser },
      isNewUser ? 'Welcome! Please complete your restaurant profile.' : 'Login successful'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Complete restaurant owner profile (name + email)
 * Role is already set — just save name/email
 */
exports.completeProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, email, role: 'restaurant' }, // enforce restaurant role
      { new: true, runValidators: true }
    );

    return successResponse(res, { user }, 'Restaurant profile completed');
  } catch (error) {
    next(error);
  }
};
