const { body, param, validationResult } = require('express-validator');

// Validation rules for events
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

// Validation rules for RSVPs
const validateRSVP = [
  body('eventId').isMongoId().withMessage('Valid event ID is required'),
  body('userId').isMongoId().withMessage('Valid user ID is required'),
  body('status').optional().isIn(['confirmed', 'cancelled', 'pending']).withMessage('Status must be confirmed, cancelled, or pending'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Validation for MongoDB ObjectId
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

module.exports = {
  validateEvent,
  validateRSVP,
  validateObjectId
};
