const Rsvp = require('../models/Rsvp');

const getAllRsvps = async (req, res) => {
  try {
    const rsvps = await Rsvp.find().populate('userId', 'name email').populate('eventId', 'title date');
    res.status(200).json(rsvps);
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

const getRsvpById = async (req, res) => {
  try {
    const rsvp = await Rsvp.findById(req.params.id).populate('userId', 'name email').populate('eventId', 'title date');
    if (!rsvp) return res.status(404).json({ error: 'RSVP not found' });
    res.status(200).json(rsvp);
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

const createRsvp = async (req, res) => {
  try {
    const { userId, eventId, status } = req.body;
    
    if (!userId || !eventId || !status) {
      return res.status(400).json({ error: 'userId, eventId, and status are required' });
    }
    
    if (!['yes', 'no', 'maybe'].includes(status)) {
      return res.status(400).json({ error: 'Status must be yes, no, or maybe' });
    }
    
    const newRsvp = await Rsvp.create({ userId, eventId, status });
    res.status(201).json(newRsvp);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'User already has an RSVP for this event' });
    }
    res.status(400).json({ error: 'Bad request: ' + error.message });
  }
};

const updateRsvp = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) return res.status(400).json({ error: 'Status is required' });
    if (!['yes', 'no', 'maybe'].includes(status)) {
      return res.status(400).json({ error: 'Status must be yes, no, or maybe' });
    }
    
    const updatedRsvp = await Rsvp.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    
    if (!updatedRsvp) return res.status(404).json({ error: 'RSVP not found' });
    res.status(200).json(updatedRsvp);
  } catch (error) {
    res.status(400).json({ error: 'Bad request: ' + error.message });
  }
};

const deleteRsvp = async (req, res) => {
  try {
    const deletedRsvp = await Rsvp.findByIdAndDelete(req.params.id);
    if (!deletedRsvp) return res.status(404).json({ error: 'RSVP not found' });
    res.status(200).json({ message: 'RSVP deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

module.exports = {
  getAllRsvps,
  getRsvpById,
  createRsvp,
  updateRsvp,
  deleteRsvp
};