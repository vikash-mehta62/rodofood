const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// ── Register ──────────────────────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { name, phone, password, email } = req.body;

    const exists = await User.findOne({ phone });
    if (exists) return errorResponse(res, 'Phone number already registered. Please login.', 409);

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, phone, email, password: hashed, role: 'customer' });

    const token = generateToken(user._id);
    return successResponse(res, { token, user }, 'Registration successful', 201);
  } catch (error) {
    next(error);
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone, role: 'customer' });
    if (!user) return errorResponse(res, 'No customer account found with this phone number.', 404);
    if (!user.isActive) return errorResponse(res, 'Your account has been deactivated. Please contact support.', 403);
    if (!user.password) return errorResponse(res, 'Password not set. Please contact support.', 400);

    const match = await bcrypt.compare(password, user.password);
    if (!match) return errorResponse(res, 'Incorrect password.', 401);

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
