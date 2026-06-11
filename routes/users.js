const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/users');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// ============ IMPORTANT: Specific routes FIRST, dynamic routes LAST ============

// ============ OAuth Routes (WEEK 06 REQUIREMENT) ============

// GitHub OAuth routes
router.get('/auth/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

router.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/login-failure' }),
  (req, res) => {
    // Successful authentication
    res.status(200).json({
      message: 'Authentication successful',
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        username: req.user.username,
        role: req.user.role
      }
    });
  }
);

// Google OAuth routes
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login-failure' }),
  (req, res) => {
    res.status(200).json({
      message: 'Authentication successful',
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    });
  }
);

// ============ User Management Routes ============

// Get current logged in user (MUST be before /:id route)
router.get('/me', isAuthenticated, async (req, res) => {
  try {
    res.status(200).json({
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      username: req.user.username,
      role: req.user.role,
      avatarUrl: req.user.avatarUrl,
      provider: req.user.provider,
      lastLogin: req.user.lastLogin,
      createdAt: req.user.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logout route
router.get('/logout', isAuthenticated, (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(200).json({ message: 'Logged out successfully' });
    });
  });
});

// ============ CRUD Operations (with authentication) ============

// Get all users - Public but limited data
router.get('/', getAllUsers);

// Create user - Requires authentication
router.post('/', isAuthenticated, createUser);

// Update user - Requires authentication
router.put('/:id', isAuthenticated, updateUser);

// Delete user - Requires admin role
router.delete('/:id', isAuthenticated, isAdmin, deleteUser);

// ============ DYNAMIC route - MUST BE LAST ============
// Get user by ID (specific user route)
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-__v');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Don't send sensitive info for non-authenticated users
    const userData = {
      id: user._id,
      name: user.name,
      username: user.username,
      email: req.isAuthenticated() ? user.email : undefined,
      avatarUrl: user.avatarUrl,
      role: user.role,
      createdAt: user.createdAt
    };
    
    res.status(200).json(userData);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Login failure route
router.get('/login-failure', (req, res) => {
  res.status(401).json({ 
    error: 'Authentication failed',
    message: 'Unable to authenticate with provider'
  });
});

module.exports = router;