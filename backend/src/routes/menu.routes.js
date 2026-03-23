const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/menu.controller');
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Menu
 *   description: Menu management
 */

// Public
router.get('/:restaurantId', ctrl.getMenu);

// Restaurant owner
router.post('/', protect, authorize('restaurant'), ctrl.addMenuItem);
router.put('/:id', protect, authorize('restaurant'), ctrl.updateMenuItem);
router.delete('/:id', protect, authorize('restaurant'), ctrl.deleteMenuItem);
router.patch('/:id/toggle', protect, authorize('restaurant'), ctrl.toggleItemAvailability);

module.exports = router;
