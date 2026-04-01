const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/menu.controller');
const { protect, authorize } = require('../middleware/auth');
const { uploadMenu } = require('../config/cloudinary');

// Public - only available items
router.get('/:restaurantId', ctrl.getMenu);

// Restaurant owner - ALL items (including unavailable)
router.get('/owner/all', protect, authorize('restaurant'), ctrl.getOwnerMenu);
router.post('/', protect, authorize('restaurant'), uploadMenu.single('image'), ctrl.addMenuItem);
router.put('/:id', protect, authorize('restaurant'), uploadMenu.single('image'), ctrl.updateMenuItem);
router.delete('/:id', protect, authorize('restaurant'), ctrl.deleteMenuItem);
router.patch('/:id/toggle', protect, authorize('restaurant'), ctrl.toggleItemAvailability);

module.exports = router;
