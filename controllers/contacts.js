const Contact = require("../models/contacts");
const mongoose = require("mongoose");

/* =========================
   GET ALL CONTACTS
========================= */
const getAll = async (req, res) => {
  let limit = parseInt(req.query.limit);

  if (isNaN(limit) || limit <= 0) {
    limit = 0; // no limit
  }

  try {
    let query = Contact.find();
    
    if (limit > 0) {
      query = query.limit(limit);
    }
    
    const result = await query.sort({ createdAt: -1 });
    
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to retrieve contacts",
      message: error.message
    });
  }
};

/* =========================
   GET SINGLE CONTACT
========================= */
const getSingle = async (req, res) => {
  const contactId = req.params.id;

  // VALIDATION (ID CHECK)
  if (!mongoose.Types.ObjectId.isValid(contactId)) {
    return res.status(400).json({
      error: "Invalid contact ID format"
    });
  }

  try {
    const result = await Contact.findById(contactId);

    if (!result) {
      return res.status(404).json({
        error: "Contact not found"
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to retrieve contact",
      message: error.message
    });
  }
};

/* =========================
   CREATE CONTACT
========================= */
const createContact = async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          error: `Missing required field: ${field}`
        });
      }
    }

    const contact = new Contact({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      favoriteColor: req.body.favoriteColor || 'Blue',
      birthday: req.body.birthday ? new Date(req.body.birthday) : null,
      phone: req.body.phone || '',
      address: req.body.address || {},
      company: req.body.company || '',
      jobTitle: req.body.jobTitle || '',
      website: req.body.website || '',
      notes: req.body.notes || '',
      createdBy: req.user?.userId
    });

    const response = await contact.save();

    return res.status(201).json({
      message: "Contact created successfully",
      id: response._id,
      contact: response
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        error: "Validation failed",
        details: err.message
      });
    }
    if (err.code === 11000) {
      return res.status(409).json({
        error: "Contact with this email already exists"
      });
    }
    return res.status(500).json({
      error: "Server error",
      message: err.message
    });
  }
};

/* =========================
   UPDATE CONTACT
========================= */
const updateContact = async (req, res) => {
  const contactId = req.params.id;

  // VALIDATION
  if (!mongoose.Types.ObjectId.isValid(contactId)) {
    return res.status(400).json({
      error: "Invalid contact ID format"
    });
  }

  try {
    // Check if contact exists
    const existingContact = await Contact.findById(contactId);
    if (!existingContact) {
      return res.status(404).json({
        error: "Contact not found"
      });
    }

    const updateData = {};
    const allowedUpdates = ['firstName', 'lastName', 'email', 'favoriteColor', 'birthday', 'phone', 'address', 'company', 'jobTitle', 'website', 'notes', 'isActive'];
    
    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        if (field === 'birthday' && req.body[field]) {
          updateData[field] = new Date(req.body[field]);
        } else {
          updateData[field] = req.body[field];
        }
      }
    }
    updateData.updatedAt = new Date();

    if (Object.keys(updateData).length === 1 && updateData.updatedAt) {
      return res.status(400).json({
        error: "No valid fields provided for update"
      });
    }

    const response = await Contact.findByIdAndUpdate(
      contactId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      message: "Contact updated successfully",
      contact: response
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        error: "Validation failed",
        details: err.message
      });
    }
    if (err.code === 11000) {
      return res.status(409).json({
        error: "Contact with this email already exists"
      });
    }
    return res.status(500).json({
      error: "Update failed",
      message: err.message
    });
  }
};

/* =========================
   DELETE CONTACT
========================= */
const deleteContact = async (req, res) => {
  const contactId = req.params.id;

  // VALIDATION
  if (!mongoose.Types.ObjectId.isValid(contactId)) {
    return res.status(400).json({
      error: "Invalid contact ID format"
    });
  }

  try {
    // Check if contact exists
    const contact = await Contact.findById(contactId);
    if (!contact) {
      return res.status(404).json({
        error: "Contact not found"
      });
    }

    const response = await Contact.findByIdAndDelete(contactId);

    return res.status(200).json({
      message: "Contact deleted successfully",
      deletedCount: 1
    });
  } catch (err) {
    return res.status(500).json({
      error: "Delete failed",
      message: err.message
    });
  }
};

// EXPORTS
module.exports = {
  getAll,
  getSingle,
  createContact,
  updateContact,
  deleteContact
};