const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// ── Login (admin only — no public register) ───────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone, role: 'admin' });
    if (!user) return errorResponse(res, 'No admin account found with this phone number.', 404);
    if (!user.isActive) return errorResponse(res, 'Account deactivated.', 403);
    if (!user.password) return errorResponse(res, 'Password not set. Please contact support.', 400);

    let match = await bcrypt.compare(password, user.password);
    if (!match && user.password === password) {
      match = true;
      user.password = await bcrypt.hash(password, 12);
    }
    if (!match) return errorResponse(res, 'Incorrect password.', 401);

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);
    return successResponse(res, { token, user }, 'Admin login successful');
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
