const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/customerAuth.controller');
const { protect, authorize } = require('../middleware/auth');
const Joi = require('joi');
const validate = require('../middleware/validate');

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  phone: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
  password: Joi.string().min(6).max(50).required(),
  email: Joi.string().email().optional().allow(''),
});

const loginSchema = Joi.object({
  phone: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
  password: Joi.string().required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).max(50).required(),
});

router.post('/register', validate(registerSchema), ctrl.register);
router.post('/login',    validate(loginSchema),    ctrl.login);
router.get('/profile',   protect, authorize('customer'), ctrl.getProfile);
router.put('/profile',   protect, authorize('customer'), ctrl.updateProfile);
router.put('/change-password', protect, authorize('customer'), validate(changePasswordSchema), ctrl.changePassword);

module.exports = router;
