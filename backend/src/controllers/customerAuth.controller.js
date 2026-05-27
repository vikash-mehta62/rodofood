const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Pending = require('../models/PendingRegistration');
const { generateEmailOTP, sendEmailOTP, EMAIL_OTP_EXPIRY_MINUTES } = require('../utils/emailService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// Step 1: Send OTP — do NOT save to User yet
exports.register = async (req, res, next) => {
  try {
    const { name, phone, email, password } = req.body;

    if (await User.findOne({ phone }))
      return errorResponse(res, 'Phone number already registered. Please login.', 409);
    if (await User.findOne({ email }))
      return errorResponse(res, 'Email already registered. Please login.', 409);

    const hashed = await bcrypt.hash(password, 12);
    const otp = generateEmailOTP();

    // Upsert pending record (replace if re-registering)
    await Pending.findOneAndUpdate(
      { email },
      { name, phone, email, password: hashed, role: 'customer', otp, createdAt: new Date() },
      { upsert: true, new: true }
    );

    await sendEmailOTP(email, otp, name);
    return successResponse(res, { email }, 'OTP sent to your email. Please verify to complete registration.');
  } catch (error) {
    next(error);
  }
};

// Step 2: Verify OTP — NOW save to User
exports.verifyEmailOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const pending = await Pending.findOne({ email, role: 'customer' });
    if (!pending) return errorResponse(res, 'Registration session expired. Please register again.', 400);
    if (pending.otp !== otp) return errorResponse(res, 'Invalid OTP.', 400);

    // Check again before creating (race condition guard)
    if (await User.findOne({ phone: pending.phone }))
      return errorResponse(res, 'Phone already registered.', 409);
    if (await User.findOne({ email }))
      return errorResponse(res, 'Email already registered.', 409);

    const user = await User.create({
      name: pending.name,
      phone: pending.phone,
      email: pending.email,
      password: pending.password,
      role: 'customer',
      isEmailVerified: true,
      lastLogin: new Date(),
    });

    await Pending.deleteOne({ email }); // clean up

    const token = generateToken(user._id);
    return successResponse(res, { token, user }, 'Email verified! Welcome to Rodofood.', 201);
  } catch (error) {
    next(error);
  }
};

// Resend OTP
exports.resendEmailOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const pending = await Pending.findOne({ email });
    if (!pending) return errorResponse(res, 'Registration session expired. Please register again.', 400);

    const otp = generateEmailOTP();
    pending.otp = otp;
    pending.createdAt = new Date();
    await pending.save();

    await sendEmailOTP(email, otp, pending.name);
    return successResponse(res, { email }, 'OTP resent successfully.');
  } catch (error) {
    next(error);
  }
};

// Login
exports.login = async (req, res, next) => {
  try {
    const { phone, email, password } = req.body;
    const query = phone ? { phone, role: 'customer' } : { email, role: 'customer' };
    const user = await User.findOne(query);
    if (!user) return errorResponse(res, 'No account found. Please register.', 404);
    if (!user.isActive) return errorResponse(res, 'Account deactivated. Please contact support.', 403);
    if (!user.isEmailVerified) return errorResponse(res, 'Email not verified. Please check your inbox.', 403);
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

exports.getProfile = async (req, res, next) => {
  try { return successResponse(res, { user: req.user }); } catch (e) { next(e); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, email }, { new: true });
    return successResponse(res, { user }, 'Profile updated');
  } catch (error) { next(error); }
};

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
  } catch (error) { next(error); }
};

// Email OTP Login - Step 1: Send OTP
exports.sendLoginOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email, role: 'customer' });
    if (!user) return errorResponse(res, 'No account found with this email. Please register.', 404);
    if (!user.isActive) return errorResponse(res, 'Account deactivated. Please contact support.', 403);

    const otp = generateEmailOTP();
    user.resetOtp = otp;
    user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendEmailOTP(email, otp, user.name, 'Login');
    return successResponse(res, { email }, 'OTP sent to your email.');
  } catch (error) { next(error); }
};

// Email OTP Login - Step 2: Verify OTP & login
exports.verifyLoginOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email, role: 'customer' });
    if (!user) return errorResponse(res, 'No account found.', 404);
    if (!user.resetOtp || user.resetOtp !== otp) return errorResponse(res, 'Invalid OTP.', 400);
    if (user.resetOtpExpiry < new Date()) return errorResponse(res, 'OTP expired. Please request again.', 400);

    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);
    return successResponse(res, { token, user }, 'Login successful');
  } catch (error) { next(error); }
};

// Forgot Password - Step 1: Send OTP to email
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email, role: 'customer' });
    if (!user) return errorResponse(res, 'No account found with this email.', 404);

    const { generateEmailOTP, sendEmailOTP } = require('../utils/emailService');
    const otp = generateEmailOTP();
    user.resetOtp = otp;
    user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await user.save();

    await sendEmailOTP(email, otp, user.name, 'Password Reset');
    return successResponse(res, { email }, 'OTP sent to your email for password reset.');
  } catch (error) { next(error); }
};

// Forgot Password - Step 2: Verify OTP & reset password
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email, role: 'customer' });
    if (!user) return errorResponse(res, 'No account found.', 404);
    if (!user.resetOtp || user.resetOtp !== otp) return errorResponse(res, 'Invalid OTP.', 400);
    if (user.resetOtpExpiry < new Date()) return errorResponse(res, 'OTP expired. Please request again.', 400);

    user.password = await bcrypt.hash(newPassword, 12);
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    await user.save();

    return successResponse(res, {}, 'Password reset successfully. Please login.');
  } catch (error) { next(error); }
};
