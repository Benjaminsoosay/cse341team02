const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const validate = require('validate.js');

// Mongoose Contact Schema
const contactSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  favoriteColor: { type: String, required: true },
  birthday: { type: String } // optional
});

const Contact = mongoose.model('Contact', contactSchema);

// Validation constraints (using validate.js)
const contactConstraints = {
  firstName: { presence: true, type: 'string' },
  lastName: { presence: true, type: 'string' },
  email: { presence: true, email: true },
  favoriteColor: { presence: true, type: 'string' },
  birthday: { type: 'string' } // optional
};

// Middleware to validate request body before creating/updating
function validateContact(req, res, next) {
  const errors = validate(req.body, contactConstraints);
  if (errors) {
    return res.status(412).json({ message: 'Validation failed', errors });
  }
  next();
}

// Helper to validate MongoDB ObjectId
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// ---------- Routes ----------

// GET all contacts
router.get('/', async (req, res, next) => {
  try {
    const contacts = await Contact.find().exec();
    res.status(200).json(contacts);
  } catch (err) {
    next(err); // Pass to global error handler
  }
});

// GET single contact by ID
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: 'Must use a valid contact ID to find a contact' });
  }
  try {
    const contact = await Contact.findById(id).exec();
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    res.status(200).json(contact);
  } catch (err) {
    next(err);
  }
});

// POST create new contact (with validation)
router.post('/', validateContact, async (req, res, next) => {
  try {
    const newContact = new Contact(req.body);
    const saved = await newContact.save();
    res.status(201).json(saved);
  } catch (err) {
    // Handle duplicate key, etc.
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Duplicate email or unique field' });
    }
    next(err);
  }
});

// PUT update contact by ID (with validation)
router.put('/:id', validateContact, async (req, res, next) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: 'Must use a valid contact ID to update a contact' });
  }
  try {
    const updated = await Contact.findByIdAndUpdate(id, req.body, { new: true, runValidators: true }).exec();
    if (!updated) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE contact by ID
router.delete('/:id', async (req, res, next) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: 'Must use a valid contact ID to delete a contact' });
  }
  try {
    const deleted = await Contact.findByIdAndDelete(id).exec();
    if (!deleted) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    res.status(200).json({ message: 'Contact deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;