const Contact = require("../models/contacts");
const mongoose = require("mongoose");

/* =========================
   GET ALL CONTACTS (with proper pagination)
========================= */
const getAll = async (req, res) => {
  // Parse pagination parameters
  let limit = parseInt(req.query.limit);
  let page = parseInt(req.query.page);
  
  // Set defaults (safe values instead of unlimited)
  if (isNaN(limit) || limit <= 0) {
    limit = 10; // DEFAULT limit instead of 0 (unlimited)
  }
  
  if (isNaN(page) || page <= 0) {
    page = 1;
  }
  
  // Cap maximum limit to prevent abuse and timeout
  const MAX_LIMIT = 100;
  if (limit > MAX_LIMIT) {
    limit = MAX_LIMIT;
  }
  
  // Calculate how many documents to skip for pagination
  const skip = (page - 1) * limit;
  
  try {
    // Get total count for pagination metadata
    const totalCount = await Contact.countDocuments();
    
    // Apply pagination correctly with skip and limit
    const result = await Contact.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec(); // exec() ensures it's a fully executed query
    
    // Return with pagination metadata
    return res.status(200).json({
      data: result,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Database error in getAll:', error);
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
    console.error('Database error in getSingle:', error);
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
    console.error('Database error in createContact:', err);
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
    console.error('Database error in updateContact:', err);
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
    console.error('Database error in deleteContact:', err);
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