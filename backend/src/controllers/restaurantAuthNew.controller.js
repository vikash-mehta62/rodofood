const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

const checkPortal = async (userId) => {
  const restaurant = await Restaurant.findOne({ owner: userId }).select('portalEnabled isActive');
  if (!restaurant) return null; // new user, no restaurant yet
  if (!restaurant.isActive) return 'deactivated';
  if (restaurant.portalEnabled === false) return 'disabled';
  return 'ok';
};

// ── Register ──────────────────────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { name, phone, password, email } = req.body;

    const exists = await User.findOne({ phone });
    if (exists) return errorResponse(res, 'Phone number already registered. Please login.', 409);

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, phone, email, password: hashed, role: 'restaurant' });

    const token = generateToken(user._id);
    return successResponse(res, { token, user }, 'Restaurant registration successful. Please set up your restaurant profile.', 201);
  } catch (error) {
    next(error);
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone, role: 'restaurant' });
    if (!user) return errorResponse(res, 'No restaurant account found with this phone number.', 404);
    if (!user.isActive) return errorResponse(res, 'Your account has been deactivated. Please contact support.', 403);
    if (!user.password) return errorResponse(res, 'Password not set. Please contact support.', 400);

    const match = await bcrypt.compare(password, user.password);
    if (!match) return errorResponse(res, 'Incorrect password.', 401);

    // Portal access check
    const portalStatus = await checkPortal(user._id);
    if (portalStatus === 'deactivated') return errorResponse(res, 'Your restaurant has been deactivated. Please contact support.', 403);
    if (portalStatus === 'disabled') return errorResponse(res, 'Your restaurant portal access has been disabled by admin. Please contact support.', 403);

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);
    return successResponse(res, { token, user }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

// ── Get Profile ───────────────────────────────────────────────────────────────
exports.getProfile = async (req, res, next) => {
  try {
    return successResponse(res, { user: req.user });
  } catch (error) {
    next(error);
  }
};

// ── Update Profile ────────────────────────────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, email },
      { new: true, runValidators: true }
    );
    return successResponse(res, { user }, 'Profile updated');
  } catch (error) {
    next(error);
  }
};

// ── Change Password ───────────────────────────────────────────────────────────
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user.password) return errorResponse(res, 'Password not set.', 400);
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return errorResponse(res, 'Current password is incorrect.', 401);

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    return successResponse(res, {}, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};
