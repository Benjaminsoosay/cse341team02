const { ObjectId } = require('mongodb');

// Validate ObjectId middleware
function validateObjectId(req, res, next) {
  const id = req.params.id;
  
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid ID format" });
  }
  
  next();
}

// Simple validation helper
function validateData(data, constraints, callback) {
  const errors = {};
  
  if (constraints && constraints.firstName && !data.firstName) {
    errors.firstName = ["First name is required"];
  }
  if (constraints && constraints.lastName && !data.lastName) {
    errors.lastName = ["Last name is required"];
  }
  if (constraints && constraints.email && !data.email) {
    errors.email = ["Email is required"];
  }
  if (constraints && constraints.favoriteColor && !data.favoriteColor) {
    errors.favoriteColor = ["Favorite color is required"];
  }
  
  if (Object.keys(errors).length > 0) {
    return callback({
      status: 400,
      message: "Validation failed",
      details: errors
    });
  }
  
  callback(null);
}

// Contact validation constraints
const contactConstraints = {
  firstName: true,
  lastName: true,
  email: true,
  favoriteColor: true
};

module.exports = {
  validateObjectId,
  validateData,
  contactConstraints
};