const mongodb = require("../db/connect");
const { ObjectId } = require("mongodb");

// GET all RSVPs (with optional filters)
const getAllRSVPs = async (req, res) => {
  try {
    let query = {};
    
    if (req.query.userId && ObjectId.isValid(req.query.userId)) {
      query.userId = new ObjectId(req.query.userId);
    }
    if (req.query.eventId && ObjectId.isValid(req.query.eventId)) {
      query.eventId = new ObjectId(req.query.eventId);
    }
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    const result = await mongodb
      .getDb()
      .db()
      .collection("rsvps")
      .find(query)
      .toArray();
    
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve RSVPs", message: err.message });
  }
};

// GET single RSVP
const getSingleRSVP = async (req, res) => {
  const rsvpId = req.params.id;
  
  if (!ObjectId.isValid(rsvpId)) {
    return res.status(400).json({ error: "Invalid RSVP ID format" });
  }
  
  try {
    const result = await mongodb
      .getDb()
      .db()
      .collection("rsvps")
      .findOne({ _id: new ObjectId(rsvpId) });
    
    if (!result) {
      return res.status(404).json({ error: "RSVP not found" });
    }
    
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve RSVP", message: err.message });
  }
};

// CREATE RSVP (protected)
const createRSVP = async (req, res) => {
  try {
    const { eventId, status } = req.body;
    const userId = new ObjectId(req.user.userId);
    
    if (!ObjectId.isValid(eventId)) {
      return res.status(400).json({ error: "Invalid event ID format" });
    }
    
    // Check if RSVP already exists
    const existing = await mongodb
      .getDb()
      .db()
      .collection("rsvps")
      .findOne({ userId, eventId: new ObjectId(eventId) });
    
    if (existing) {
      return res.status(409).json({ error: "RSVP already exists for this user and event" });
    }
    
    const rsvp = {
      userId,
      eventId: new ObjectId(eventId),
      status: status || "pending",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const response = await mongodb
      .getDb()
      .db()
      .collection("rsvps")
      .insertOne(rsvp);
    
    // Update event attendee count
    if (status === "confirmed") {
      await mongodb
        .getDb()
        .db()
        .collection("events")
        .updateOne(
          { _id: new ObjectId(eventId) },
          { $inc: { currentAttendees: 1 } }
        );
    }
    
    if (response.acknowledged) {
      res.status(201).json({
        message: "RSVP created successfully",
        id: response.insertedId,
        rsvp
      });
    } else {
      res.status(500).json({ error: "Failed to create RSVP" });
    }
  } catch (err) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
};

// UPDATE RSVP (protected)
const updateRSVP = async (req, res) => {
  const rsvpId = req.params.id;
  
  if (!ObjectId.isValid(rsvpId)) {
    return res.status(400).json({ error: "Invalid RSVP ID format" });
  }
  
  const { status } = req.body;
  
  if (!status || !["pending", "confirmed", "cancelled"].includes(status)) {
    return res.status(400).json({ error: "Valid status is required" });
  }
  
  try {
    // Get old status to adjust event count
    const oldRSVP = await mongodb
      .getDb()
      .db()
      .collection("rsvps")
      .findOne({ _id: new ObjectId(rsvpId) });
    
    if (!oldRSVP) {
      return res.status(404).json({ error: "RSVP not found" });
    }
    
    const response = await mongodb
      .getDb()
      .db()
      .collection("rsvps")
      .updateOne(
        { _id: new ObjectId(rsvpId) },
        { $set: { status, updatedAt: new Date() } }
      );
    
    // Update event attendee count if status changed to/from confirmed
    if (oldRSVP.status !== status) {
      const eventId = oldRSVP.eventId;
      let increment = 0;
      
      if (status === "confirmed") increment = 1;
      if (oldRSVP.status === "confirmed") increment = -1;
      
      if (increment !== 0) {
        await mongodb
          .getDb()
          .db()
          .collection("events")
          .updateOne(
            { _id: eventId },
            { $inc: { currentAttendees: increment } }
          );
      }
    }
    
    res.status(200).json({ message: "RSVP updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Update failed", message: err.message });
  }
};

// DELETE RSVP (protected)
const deleteRSVP = async (req, res) => {
  const rsvpId = req.params.id;
  
  if (!ObjectId.isValid(rsvpId)) {
    return res.status(400).json({ error: "Invalid RSVP ID format" });
  }
  
  try {
    // Get RSVP to adjust event count
    const rsvp = await mongodb
      .getDb()
      .db()
      .collection("rsvps")
      .findOne({ _id: new ObjectId(rsvpId) });
    
    if (!rsvp) {
      return res.status(404).json({ error: "RSVP not found" });
    }
    
    const response = await mongodb
      .getDb()
      .db()
      .collection("rsvps")
      .deleteOne({ _id: new ObjectId(rsvpId) });
    
    // Decrease event attendee count if was confirmed
    if (rsvp.status === "confirmed") {
      await mongodb
        .getDb()
        .db()
        .collection("events")
        .updateOne(
          { _id: rsvp.eventId },
          { $inc: { currentAttendees: -1 } }
        );
    }
    
    res.status(200).json({ message: "RSVP deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed", message: err.message });
  }
};

module.exports = {
  getAllRSVPs,
  getSingleRSVP,
  createRSVP,
  updateRSVP,
  deleteRSVP
};