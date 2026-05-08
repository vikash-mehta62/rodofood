const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/customerAuth.controller');
const { protect, authorize } = require('../middleware/auth');
const Joi = require('joi');
const validate = require('../middleware/validate');

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  phone: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(50).required(),
});

const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
});

const loginSchema = Joi.object({
  phone: Joi.string().pattern(/^[6-9]\d{9}$/).optional(),
  email: Joi.string().email().optional(),
  password: Joi.string().required(),
}).or('phone', 'email');

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).max(50).required(),
});

router.post('/register',        validate(registerSchema),       ctrl.register);
router.post('/verify-email',    validate(verifyOtpSchema),      ctrl.verifyEmailOtp);
router.post('/resend-otp',      validate(Joi.object({ email: Joi.string().email().required() })), ctrl.resendEmailOtp);
router.post('/login',           validate(loginSchema),          ctrl.login);
router.get('/profile',          protect, authorize('customer'), ctrl.getProfile);
router.put('/profile',          protect, authorize('customer'), ctrl.updateProfile);
router.put('/change-password',  protect, authorize('customer'), validate(changePasswordSchema), ctrl.changePassword);

module.exports = router;
