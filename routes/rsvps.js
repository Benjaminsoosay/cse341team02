const express = require('express');
const router = express.Router();
const {
  getAllRsvps,
  getRsvpById,
  createRsvp,
  updateRsvp,
  deleteRsvp
} = require('../controllers/rsvps');
const { isAuthenticated } = require('../middleware/auth');

// Public routes (GET)
router.get('/', getAllRsvps);
router.get('/:id', getRsvpById);

// Protected routes - require OAuth authentication (WEEK 06 REQUIREMENT)
router.post('/', isAuthenticated, createRsvp);
router.put('/:id', isAuthenticated, updateRsvp);
router.delete('/:id', isAuthenticated, deleteRsvp);

module.exports = router;