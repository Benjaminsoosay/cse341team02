const mongodb = require("../db/connect");
const { ObjectId } = require("mongodb");

// GET all events
const getAllEvents = async (req, res) => {
  try {
    let limit = parseInt(req.query.limit);
    if (isNaN(limit) || limit <= 0) limit = 0;
    
    let query = mongodb.getDb().db().collection("events").find();
    
    // Filter by createdBy if provided
    if (req.query.createdBy && ObjectId.isValid(req.query.createdBy)) {
      query = query.filter({ createdBy: new ObjectId(req.query.createdBy) });
    }
    
    const result = await query.limit(limit).toArray();
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve events", message: err.message });
  }
};

// GET single event
const getSingleEvent = async (req, res) => {
  const eventId = req.params.id;
  
  if (!ObjectId.isValid(eventId)) {
    return res.status(400).json({ error: "Invalid event ID format" });
  }
  
  try {
    const result = await mongodb
      .getDb()
      .db()
      .collection("events")
      .findOne({ _id: new ObjectId(eventId) });
    
    if (!result) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve event", message: err.message });
  }
};

// CREATE event (protected)
const createEvent = async (req, res) => {
  try {
    const event = {
      title: req.body.title,
      description: req.body.description,
      date: new Date(req.body.date),
      location: req.body.location,
      createdBy: new ObjectId(req.user.userId), // from JWT
      createdAt: new Date(),
      maxAttendees: req.body.maxAttendees || null,
      currentAttendees: 0,
      status: "upcoming",
      tags: req.body.tags || []
    };
    
    const response = await mongodb
      .getDb()
      .db()
      .collection("events")
      .insertOne(event);
    
    if (response.acknowledged) {
      res.status(201).json({
        message: "Event created successfully",
        id: response.insertedId,
        event
      });
    } else {
      res.status(500).json({ error: "Failed to create event" });
    }
  } catch (err) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
};

// UPDATE event (protected)
const updateEvent = async (req, res) => {
  const eventId = req.params.id;
  
  if (!ObjectId.isValid(eventId)) {
    return res.status(400).json({ error: "Invalid event ID format" });
  }
  
  const updateData = {};
  if (req.body.title) updateData.title = req.body.title;
  if (req.body.description) updateData.description = req.body.description;
  if (req.body.date) updateData.date = new Date(req.body.date);
  if (req.body.location) updateData.location = req.body.location;
  if (req.body.maxAttendees) updateData.maxAttendees = req.body.maxAttendees;
  if (req.body.status) updateData.status = req.body.status;
  if (req.body.tags) updateData.tags = req.body.tags;
  updateData.updatedAt = new Date();
  
  try {
    const response = await mongodb
      .getDb()
      .db()
      .collection("events")
      .updateOne(
        { _id: new ObjectId(eventId) },
        { $set: updateData }
      );
    
    if (response.matchedCount === 0) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    res.status(200).json({ message: "Event updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Update failed", message: err.message });
  }
};

// DELETE event (protected)
const deleteEvent = async (req, res) => {
  const eventId = req.params.id;
  
  if (!ObjectId.isValid(eventId)) {
    return res.status(400).json({ error: "Invalid event ID format" });
  }
  
  try {
    const response = await mongodb
      .getDb()
      .db()
      .collection("events")
      .deleteOne({ _id: new ObjectId(eventId) });
    
    if (response.deletedCount === 0) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    res.status(200).json({ message: "Event deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed", message: err.message });
  }
};

module.exports = {
  getAllEvents,
  getSingleEvent,
  createEvent,
  updateEvent,
  deleteEvent
};