const { body, param, validationResult } = require('express-validator');

// ============ EVENT VALIDATION ============
// Validation rules for creating/updating an event
const validateEvent = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').optional().isString(),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('location').notEmpty().withMessage('Location is required'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Validation for MongoDB ObjectId parameter (matches what your route expects)
const validateObjectId = [
  param('id').isMongoId().withMessage('Invalid ID format'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// ============ USER VALIDATION (if needed) ============
const validateUser = [
  body('name').optional().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Role must be user or admin'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

const validateUserId = [
  param('id').isMongoId().withMessage('Invalid user ID format'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

const validateGoogleAuth = [
  body('idToken').notEmpty().withMessage('idToken is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = {
  // Event validations (your route expects these exact names)
  validateEvent,
  validateObjectId,  // Make sure this is spelled exactly as in your route
  // User validations
  validateUser,
  validateUserId,
  validateGoogleAuth
};