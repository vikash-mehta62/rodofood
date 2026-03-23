const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/cms.controller');
const { protect, authorize } = require('../middleware/auth');

router.get('/', ctrl.getAllContent); // public - for landing page
router.post('/', protect, authorize('admin'), ctrl.upsertContent);
router.delete('/:id', protect, authorize('admin'), ctrl.deleteContent);

module.exports = router;
