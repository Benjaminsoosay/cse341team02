const express = require('express');
const router = express.Router();
const passport = require('passport');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/users');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Public routes
router.get('/', getAllUsers);
router.get('/:id', getUserById);

// Protected routes - require OAuth (WEEK 06 REQUIREMENT)
router.post('/', isAuthenticated, createUser);
router.put('/:id', isAuthenticated, updateUser);
router.delete('/:id', isAuthenticated, isAdmin, deleteUser);

// OAuth routes (WEEK 06 REQUIREMENT)
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/api-docs');
  }
);

router.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});

router.get('/me', isAuthenticated, (req, res) => {
  res.json(req.user);
});

module.exports = router;