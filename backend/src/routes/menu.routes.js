const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/menu.controller');
const { protect, authorize, checkPortalAccess } = require('../middleware/auth');
const { uploadMenu } = require('../config/cloudinary');

// Public - only available items from active+portal-enabled restaurants
router.get('/:restaurantId', ctrl.getMenu);

// Restaurant owner - ALL items (including unavailable)
router.get('/owner/all', protect, authorize('restaurant'), checkPortalAccess, ctrl.getOwnerMenu);
router.post('/', protect, authorize('restaurant'), checkPortalAccess, uploadMenu.single('image'), ctrl.addMenuItem);
router.put('/:id', protect, authorize('restaurant'), checkPortalAccess, uploadMenu.single('image'), ctrl.updateMenuItem);
router.delete('/:id', protect, authorize('restaurant'), checkPortalAccess, ctrl.deleteMenuItem);
router.patch('/:id/toggle', protect, authorize('restaurant'), checkPortalAccess, ctrl.toggleItemAvailability);

module.exports = router;
