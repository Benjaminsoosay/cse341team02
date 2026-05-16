const validate = require('validate.js');

// Validation constraints for Contact
const contactConstraints = {
  firstName: {
    presence: { allowEmpty: false },
    type: 'string'
  },
  lastName: {
    presence: { allowEmpty: false },
    type: 'string'
  },
  email: {
    presence: { allowEmpty: false },
    email: true
  },
  favoriteColor: {
    presence: { allowEmpty: false },
    type: 'string'
  },
  birthday: {
    type: 'string',
    presence: false
  }
};

// Generic validation helper
function validateData(data, constraints, callback) {
  const errors = validate(data, constraints); // removed "flat" format

  if (errors) {
    return callback({
      status: 412,
      message: 'Validation failed',
      details: errors
    });
  }

  callback(null);
}

module.exports = {
  contactConstraints,
  validateData
};