const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/payment.controller');
const { protect, authorize } = require('../middleware/auth');

router.post('/initiate', protect, authorize('customer'), ctrl.initiatePayment);
router.post('/verify', protect, authorize('customer'), ctrl.verifyPayment);

module.exports = router;
