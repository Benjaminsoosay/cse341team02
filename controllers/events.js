const Event = require('../models/Event');

const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

const createEvent = async (req, res) => {
  try {
    const { title, description, date, location, capacity } = req.body;
    
    if (!title || !date || !location || !capacity) {
      return res.status(400).json({ error: 'Title, date, location, and capacity are required' });
    }
    
    if (capacity < 1) {
      return res.status(400).json({ error: 'Capacity must be at least 1' });
    }
    
    const newEvent = await Event.create({ title, description, date, location, capacity });
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(400).json({ error: 'Bad request: ' + error.message });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { title, description, date, location, capacity } = req.body;
    
    if (!title || !date || !location || !capacity) {
      return res.status(400).json({ error: 'Title, date, location, and capacity are required' });
    }
    
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { title, description, date, location, capacity },
      { new: true, runValidators: true }
    );
    
    if (!updatedEvent) return res.status(404).json({ error: 'Event not found' });
    res.status(200).json(updatedEvent);
  } catch (error) {
    res.status(400).json({ error: 'Bad request: ' + error.message });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const deletedEvent = await Event.findByIdAndDelete(req.params.id);
    if (!deletedEvent) return res.status(404).json({ error: 'Event not found' });
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
};