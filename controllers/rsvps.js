const RSVP = require("../models/rsvps");
const Event = require("../models/events");
const mongoose = require("mongoose");

// GET all RSVPs (with optional filters)
const getAllRSVPs = async (req, res) => {
  try {
    let query = {};
    
    if (req.query.userId && mongoose.Types.ObjectId.isValid(req.query.userId)) {
      query.userId = req.query.userId;
    }
    if (req.query.eventId && mongoose.Types.ObjectId.isValid(req.query.eventId)) {
      query.eventId = req.query.eventId;
    }
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    const result = await RSVP.find(query)
      .populate('eventId', 'title startDate location capacity')
      .populate('userId', 'firstName lastName email')
      .sort({ rsvpDate: -1 });
    
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve RSVPs", message: err.message });
  }
};

// GET single RSVP
const getSingleRSVP = async (req, res) => {
  const rsvpId = req.params.id;
  
  if (!mongoose.Types.ObjectId.isValid(rsvpId)) {
    return res.status(400).json({ error: "Invalid RSVP ID format" });
  }
  
  try {
    const result = await RSVP.findById(rsvpId)
      .populate('eventId', 'title startDate location capacity')
      .populate('userId', 'firstName lastName email');
    
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
    const { eventId, status, attendees, ticketType, dietaryRestrictions, specialRequests, notes } = req.body;
    const userId = req.user.userId;
    
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ error: "Invalid event ID format" });
    }
    
    // Check if RSVP already exists
    const existing = await RSVP.findOne({ userId, eventId });
    
    if (existing) {
      return res.status(409).json({ error: "RSVP already exists for this user and event" });
    }
    
    // Get user info for the RSVP
    const User = require("../models/users");
    const user = await User.findById(userId).select('firstName lastName email');
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Get event to check capacity
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    const attendeesCount = attendees || 1;
    
    // Check capacity
    if (event.currentAttendees + attendeesCount > event.capacity) {
      return res.status(400).json({ error: "Event capacity would be exceeded" });
    }
    
    const rsvp = new RSVP({
      userId,
      eventId,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      status: status || "pending",
      attendees: attendeesCount,
      ticketType: ticketType || "General",
      dietaryRestrictions: dietaryRestrictions || "",
      specialRequests: specialRequests || "",
      notes: notes || "",
      rsvpDate: new Date(),
      paymentStatus: "pending",
      paymentAmount: event.price * attendeesCount
    });
    
    const response = await rsvp.save();
    
    // Update event attendee count if status is confirmed
    if (status === "confirmed") {
      await Event.findByIdAndUpdate(eventId, {
        $inc: { currentAttendees: attendeesCount }
      });
    }
    
    res.status(201).json({
      message: "RSVP created successfully",
      id: response._id,
      rsvp: response
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: "Validation failed", details: err.message });
    }
    res.status(500).json({ error: "Server error", message: err.message });
  }
};

// UPDATE RSVP (protected)
const updateRSVP = async (req, res) => {
  const rsvpId = req.params.id;
  
  if (!mongoose.Types.ObjectId.isValid(rsvpId)) {
    return res.status(400).json({ error: "Invalid RSVP ID format" });
  }
  
  try {
    // Get old RSVP to adjust event count
    const oldRSVP = await RSVP.findById(rsvpId);
    
    if (!oldRSVP) {
      return res.status(404).json({ error: "RSVP not found" });
    }
    
    // Check if user owns this RSVP
    if (oldRSVP.userId.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Not authorized to update this RSVP" });
    }
    
    const updateData = {};
    const allowedUpdates = ['status', 'attendees', 'dietaryRestrictions', 'specialRequests', 'ticketType', 'notes'];
    
    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        if (field === 'attendees') {
          updateData[field] = parseInt(req.body[field]);
        } else {
          updateData[field] = req.body[field];
        }
      }
    }
    updateData.updatedAt = new Date();
    
    const response = await RSVP.findByIdAndUpdate(
      rsvpId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    // Update event attendee count if status changed
    if (oldRSVP.status !== updateData.status) {
      const eventId = oldRSVP.eventId;
      let attendeesDiff = 0;
      
      // Calculate difference in attendees
      const oldAttendees = oldRSVP.attendees;
      const newAttendees = updateData.attendees || oldRSVP.attendees;
      attendeesDiff = newAttendees - oldAttendees;
      
      if (attendeesDiff !== 0) {
        const event = await Event.findById(eventId);
        if (event && event.currentAttendees + attendeesDiff <= event.capacity) {
          await Event.findByIdAndUpdate(eventId, {
            $inc: { currentAttendees: attendeesDiff }
          });
        }
      }
    }
    
    res.status(200).json({ 
      message: "RSVP updated successfully",
      rsvp: response
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: "Validation failed", details: err.message });
    }
    res.status(500).json({ error: "Update failed", message: err.message });
  }
};

// DELETE RSVP (protected)
const deleteRSVP = async (req, res) => {
  const rsvpId = req.params.id;
  
  if (!mongoose.Types.ObjectId.isValid(rsvpId)) {
    return res.status(400).json({ error: "Invalid RSVP ID format" });
  }
  
  try {
    // Get RSVP to adjust event count
    const rsvp = await RSVP.findById(rsvpId);
    
    if (!rsvp) {
      return res.status(404).json({ error: "RSVP not found" });
    }
    
    // Check if user owns this RSVP
    if (rsvp.userId.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Not authorized to delete this RSVP" });
    }
    
    // Decrease event attendee count if was confirmed
    if (rsvp.status === "confirmed") {
      await Event.findByIdAndUpdate(rsvp.eventId, {
        $inc: { currentAttendees: -rsvp.attendees }
      });
    }
    
    await RSVP.findByIdAndDelete(rsvpId);
    
    res.status(200).json({ 
      message: "RSVP deleted successfully",
      deletedCount: 1
    });
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