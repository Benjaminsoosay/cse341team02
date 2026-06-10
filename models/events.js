const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    minlength: [10, 'Description must be at least 10 characters']
  },
  category: {
    type: String,
    enum: ['Conference', 'Workshop', 'Hackathon', 'Summit', 'Bootcamp', 'Networking', 'Other'],
    default: 'Other'
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  location: {
    type: String,
    required: [true, 'Location is required']
  },
  venue: {
    type: String
  },
  capacity: {
    type: Number,
    required: true,
    min: [1, 'Capacity must be at least 1']
  },
  price: {
    type: Number,
    default: 0,
    min: 0
  },
  isVirtual: {
    type: Boolean,
    default: false
  },
  organizer: {
    type: String,
    required: true
  },
  organizerEmail: {
    type: String,
    required: true,
    lowercase: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled', 'past'],
    default: 'upcoming'
  },
  tags: [{
    type: String,
    trim: true
  }],
  imageUrl: {
    type: String
  },
  currentAttendees: {
    type: Number,
    default: 0,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
  }
});

// Create indexes
eventSchema.index({ startDate: 1, status: 1 });
eventSchema.index({ createdBy: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ isVirtual: 1 });

// Updated model name to match filename (lowercase, plural)
module.exports = mongoose.model('events', eventSchema);