const { contactConstraints, validateData } = require('./validation-helpers');

// Middleware for saving a contact
exports.saveContact = (req, res, next) => {
  validateData(req.body, contactConstraints, (err) => {
    if (err) {
      return res.status(err.status).json({
        error: err.message,
        details: err.details
      });
    }
    next();
  });
};