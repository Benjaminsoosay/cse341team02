// Data validation middleware (WEEK 06 REQUIREMENT)
const validateContact = (req, res, next) => {
  const { name, email } = req.body;
  const errors = [];
  
  if (!name || name.trim() === '') {
    errors.push('Name is required');
  }
  
  if (!email || email.trim() === '') {
    errors.push('Email is required');
  } else if (!/^\S+@\S+\.\S+$/.test(email)) {
    errors.push('Please enter a valid email address');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  
  next();
};

const validateEvent = (req, res, next) => {
  const { title, date, location, capacity } = req.body;
  const errors = [];
  
  if (!title || title.trim() === '') errors.push('Title is required');
  if (!date) errors.push('Date is required');
  if (!location || location.trim() === '') errors.push('Location is required');
  if (!capacity) errors.push('Capacity is required');
  if (capacity && capacity < 1) errors.push('Capacity must be at least 1');
  
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  
  next();
};

const validateRsvp = (req, res, next) => {
  const { userId, eventId, status } = req.body;
  const errors = [];
  
  if (!userId) errors.push('User ID is required');
  if (!eventId) errors.push('Event ID is required');
  if (!status) errors.push('Status is required');
  if (status && !['yes', 'no', 'maybe'].includes(status)) {
    errors.push('Status must be yes, no, or maybe');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  
  next();
};

const validateUser = (req, res, next) => {
  const { name, email } = req.body;
  const errors = [];
  
  if (!name || name.trim() === '') errors.push('Name is required');
  if (!email || email.trim() === '') errors.push('Email is required');
  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    errors.push('Please enter a valid email address');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  
  next();
};

module.exports = { validateContact, validateEvent, validateRsvp, validateUser };