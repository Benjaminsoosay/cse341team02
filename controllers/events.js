const Event = require("../models/events");
const mongoose = require("mongoose");

// GET all events with filtering
const getAllEvents = async (req, res) => {
  try {
    let limit = parseInt(req.query.limit);
    if (isNaN(limit) || limit <= 0) limit = 0;
    
    let query = {};
    
    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Filter by category if provided
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    // Filter by createdBy if provided
    if (req.query.createdBy && mongoose.Types.ObjectId.isValid(req.query.createdBy)) {
      query.createdBy = req.query.createdBy;
    }
    
    // Filter by date range
    if (req.query.startDate) {
      query.date = { ...query.date, $gte: new Date(req.query.startDate) };
    }
    if (req.query.endDate) {
      query.date = { ...query.date, $lte: new Date(req.query.endDate) };
    }
    
    let eventsQuery = Event.find(query).sort({ date: 1 });
    
    if (limit > 0) {
      eventsQuery = eventsQuery.limit(limit);
    }
    
    const events = await eventsQuery;
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ 
      error: "Failed to retrieve events", 
      message: err.message 
    });
  }
};

// GET single event by ID
const getSingleEvent = async (req, res) => {
  const eventId = req.params.id;
  
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return res.status(400).json({ error: "Invalid event ID format" });
  }
  
  try {
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    res.status(200).json(event);
  } catch (err) {
    res.status(500).json({ 
      error: "Failed to retrieve event", 
      message: err.message 
    });
  }
};

// CREATE event (protected)
const createEvent = async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = ['title', 'description', 'date', 'location'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ 
          error: `Missing required field: ${field}` 
        });
      }
    }
    
    const event = new Event({
      title: req.body.title,
      description: req.body.description,
      date: new Date(req.body.date),
      location: req.body.location,
      createdBy: req.user.userId, // from JWT
      maxAttendees: req.body.maxAttendees,
      category: req.body.category,
      isVirtual: req.body.isVirtual || false,
      price: req.body.price,
      tags: req.body.tags || []
    });
    
    const savedEvent = await event.save();
    
    res.status(201).json({
      message: "Event created successfully",
      event: savedEvent
    });
  } catch (err) {
    // Handle validation errors
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        error: "Validation failed", 
        details: err.message 
      });
    }
    res.status(500).json({ 
      error: "Server error", 
      message: err.message 
    });
  }
};

// UPDATE event (protected)
const updateEvent = async (req, res) => {
  const eventId = req.params.id;
  
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return res.status(400).json({ error: "Invalid event ID format" });
  }
  
  try {
    // Check if event exists
    const existingEvent = await Event.findById(eventId);
    if (!existingEvent) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    // Check if user owns the event or is admin
    if (existingEvent.createdBy.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Not authorized to update this event" });
    }
    
    const updateData = {};
    const allowedUpdates = ['title', 'description', 'date', 'location', 'maxAttendees', 'status', 'tags', 'category', 'isVirtual', 'price'];
    
    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        if (field === 'date') {
          updateData[field] = new Date(req.body[field]);
        } else {
          updateData[field] = req.body[field];
        }
      }
    }
    updateData.updatedAt = new Date();
    
    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      message: "Event updated successfully",
      event: updatedEvent
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        error: "Validation failed", 
        details: err.message 
      });
    }
    res.status(500).json({ 
      error: "Update failed", 
      message: err.message 
    });
  }
};

// DELETE event (protected)
const deleteEvent = async (req, res) => {
  const eventId = req.params.id;
  
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return res.status(400).json({ error: "Invalid event ID format" });
  }
  
  try {
    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    // Check if user owns the event or is admin
    if (event.createdBy.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Not authorized to delete this event" });
    }
    
    await Event.findByIdAndDelete(eventId);
    
    res.status(200).json({ message: "Event deleted successfully" });
  } catch (err) {
    res.status(500).json({ 
      error: "Delete failed", 
      message: err.message 
    });
  }
};

module.exports = {
  getAllEvents,
  getSingleEvent,
  createEvent,
  updateEvent,
  deleteEvent
};