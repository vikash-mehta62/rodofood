const Joi = require('joi');

const sendOtpSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'Please provide a valid 10-digit Indian mobile number',
    }),
});

const verifyOtpSchema = Joi.object({
  phone: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().optional().allow(''),
});

module.exports = { sendOtpSchema, verifyOtpSchema, updateProfileSchema };
