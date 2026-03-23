const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/support.controller');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, ctrl.createTicket);
router.get('/my', protect, ctrl.getMyTickets);
router.get('/', protect, authorize('admin'), ctrl.getAllTickets);
router.patch('/:id', protect, authorize('admin'), ctrl.updateTicket);

module.exports = router;
