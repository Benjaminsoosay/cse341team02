const mongoose = require('mongoose');

const rsvpSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'Event ID is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true,
    lowercase: true
  },
  status: {
    type: String,
    enum: ['confirmed', 'pending', 'cancelled', 'waitlisted', 'attended'],
    default: 'pending'
  },
  attendees: {
    type: Number,
    required: true,
    min: [1, 'At least 1 attendee required'],
    max: [10, 'Maximum 10 attendees per booking']
  },
  dietaryRestrictions: {
    type: String,
    trim: true
  },
  specialRequests: {
    type: String,
    trim: true
  },
  checkedIn: {
    type: Boolean,
    default: false
  },
  rsvpDate: {
    type: Date,
    default: Date.now
  },
  ticketType: {
    type: String,
    enum: ['VIP', 'General', 'Early Bird', 'Team Pass', 'Executive'],
    default: 'General'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },
  paymentAmount: {
    type: Number,
    default: 0
  },
  notes: {
    type: String
  },
  updatedAt: {
    type: Date
  }
});

// Ensure one user can only RSVP once per event
rsvpSchema.index({ eventId: 1, userId: 1 }, { unique: true });
rsvpSchema.index({ eventId: 1, status: 1 });
rsvpSchema.index({ userId: 1 });
rsvpSchema.index({ status: 1 });

module.exports = mongoose.model('RSVP', rsvpSchema);