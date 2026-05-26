const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const mongodb = require("../db/connect");
const { verifyToken } = require("../middleware/validation");
const { 
  validateContact, 
  validateObjectId,
  sanitizeInput 
} = require("../utils/validation-helpers");

// ==================== CONTROLLER FUNCTIONS ====================

// GET all contacts (for authenticated user)
const getAllContacts = async (req, res, next) => {
  try {
    const db = mongodb.getDb();
    const userId = req.user ? req.user.userId : null;
    
    // If user is authenticated, get their contacts, otherwise get all (admin)
    let query = {};
    if (userId && req.user.role !== 'admin') {
      query = { userId: userId };
    }
    
    const contacts = await db.collection("contacts").find(query).toArray();
    res.status(200).json(contacts);
  } catch (err) {
    next(err);
  }
};

// GET single contact by ID
const getSingleContact = async (req, res, next) => {
  try {
    const db = mongodb.getDb();
    const contactId = new ObjectId(req.params.id);
    const userId = req.user ? req.user.userId : null;
    
    // Build query
    let query = { _id: contactId };
    if (userId && req.user.role !== 'admin') {
      query.userId = userId;
    }
    
    const contact = await db.collection("contacts").findOne(query);
    
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }
    res.status(200).json(contact);
  } catch (err) {
    next(err);
  }
};

// POST create new contact
const createContact = async (req, res, next) => {
  try {
    const db = mongodb.getDb();
    
    // Sanitize input
    const sanitizedData = sanitizeInput(req.body);
    
    // Add metadata
    const newContact = {
      ...sanitizedData,
      userId: req.user.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection("contacts").insertOne(newContact);
    
    if (result.acknowledged) {
      res.status(201).json({ 
        message: "Contact created successfully",
        id: result.insertedId,
        contact: { ...newContact, _id: result.insertedId }
      });
    } else {
      res.status(500).json({ message: "Failed to create contact" });
    }
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Duplicate email address" });
    }
    next(err);
  }
};

// PUT update contact by ID
const updateContact = async (req, res, next) => {
  try {
    const db = mongodb.getDb();
    const contactId = new ObjectId(req.params.id);
    
    // Check if contact exists and belongs to user
    let query = { _id: contactId };
    if (req.user.role !== 'admin') {
      query.userId = req.user.userId;
    }
    
    const existingContact = await db.collection("contacts").findOne(query);
    if (!existingContact) {
      return res.status(404).json({ message: "Contact not found" });
    }
    
    // Sanitize input and remove _id from update data
    const sanitizedData = sanitizeInput(req.body);
    delete sanitizedData._id;
    delete sanitizedData.userId;
    delete sanitizedData.createdAt;
    
    // Add updated timestamp
    const updateData = {
      ...sanitizedData,
      updatedAt: new Date()
    };
    
    const result = await db.collection("contacts").updateOne(
      { _id: contactId },
      { $set: updateData }
    );
    
    if (result.modifiedCount > 0) {
      const updatedContact = await db.collection("contacts").findOne({ _id: contactId });
      res.status(200).json({ 
        message: "Contact updated successfully",
        contact: updatedContact
      });
    } else {
      res.status(404).json({ message: "Contact not found or no changes made" });
    }
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Duplicate email address" });
    }
    next(err);
  }
};

// DELETE contact by ID
const deleteContact = async (req, res, next) => {
  try {
    const db = mongodb.getDb();
    const contactId = new ObjectId(req.params.id);
    
    // Build query based on user role
    let query = { _id: contactId };
    if (req.user.role !== 'admin') {
      query.userId = req.user.userId;
    }
    
    const result = await db.collection("contacts").deleteOne(query);
    
    if (result.deletedCount > 0) {
      res.status(200).json({ 
        message: "Contact deleted successfully",
        id: req.params.id
      });
    } else {
      res.status(404).json({ message: "Contact not found" });
    }
  } catch (err) {
    next(err);
  }
};

// ==================== ROUTES ====================

// Public routes (no auth required for reading - optional)
// Remove these if you want all routes to require authentication
router.get("/", getAllContacts);
router.get("/:id", validateObjectId, getSingleContact);

// Protected routes (require authentication)
router.post("/", verifyToken, validateContact, createContact);
router.put("/:id", verifyToken, validateObjectId, validateContact, updateContact);
router.delete("/:id", verifyToken, validateObjectId, deleteContact);

// Admin-only routes (example)
// router.delete("/admin/:id", verifyToken, requireAdmin, validateObjectId, adminDeleteContact);

module.exports = router;