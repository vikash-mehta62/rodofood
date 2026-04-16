const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp, completeProfile } = require('../controllers/restaurantAuth.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const Joi = require('joi');

const phoneSchema = Joi.object({
  phone: Joi.string().pattern(/^[6-9]\d{9}$/).required()
    .messages({ 'string.pattern.base': 'Valid 10-digit Indian mobile number required' }),
});

const otpSchema = Joi.object({
  phone: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
});

const profileSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().optional().allow(''),
});

router.post('/send-otp',        validate(phoneSchema),   sendOtp);
router.post('/verify-otp',      validate(otpSchema),     verifyOtp);
router.put('/complete-profile', protect, validate(profileSchema), completeProfile);

module.exports = router;
