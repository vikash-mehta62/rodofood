const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminAuth.controller');
const { protect, authorize } = require('../middleware/auth');
const Joi = require('joi');
const validate = require('../middleware/validate');

const loginSchema = Joi.object({
  phone: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
  password: Joi.string().required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).max(50).required(),
});

// Admin login — no public register
router.post('/login',    validate(loginSchema), ctrl.login);
router.get('/profile',   protect, authorize('admin'), ctrl.getProfile);
router.put('/change-password', protect, authorize('admin'), validate(changePasswordSchema), ctrl.changePassword);

module.exports = router;
