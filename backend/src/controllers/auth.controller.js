const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateOTP, sendOTP, OTP_EXPIRY_MINUTES } = require('../utils/otpService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

/**
 * @swagger
 * /auth/send-otp:
 *   post:
 *     summary: Send OTP to mobile number
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone: { type: string, example: "9876543210" }
 */
exports.sendOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;

    let user = await User.findOne({ phone });

    // Rate limit: max 3 OTP requests per 10 min
    if (user && user.otpAttempts >= 3 && user.otpExpiry > new Date()) {
      return errorResponse(res, 'Too many OTP requests. Please wait 10 minutes.', 429);
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    if (!user) {
      user = await User.create({ phone, otp, otpExpiry, otpAttempts: 1 });
    } else {
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      await user.save();
    }

    await sendOTP(phone, otp);

    // In development, return OTP in response for testing
    const responseData = process.env.NODE_ENV === 'development'
      ? { phone, devOtp: otp }
      : { phone };

    return successResponse(res, responseData, 'OTP sent successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Verify OTP and login/register
 *     tags: [Auth]
 *     security: []
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

    // Clear OTP fields
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.otpAttempts = 0;
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);
    const isNewUser = !user.name;

    return successResponse(
      res,
      { token, user, isNewUser },
      isNewUser ? 'Welcome to Rodofood! Please complete your profile.' : 'Login successful'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 */
exports.getProfile = async (req, res, next) => {
  try {
    return successResponse(res, { user: req.user });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /auth/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Auth]
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, email },
      { new: true, runValidators: true }
    );
    return successResponse(res, { user }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};
