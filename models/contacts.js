const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    minlength: [2, 'First name must be at least 2 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    minlength: [2, 'Last name must be at least 2 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  favoriteColor: {
    type: String,
    default: 'Blue'
  },
  birthday: {
    type: Date
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  company: {
    type: String,
    trim: true
  },
  jobTitle: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  notes: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Indexes
contactSchema.index({ email: 1 });
contactSchema.index({ firstName: 1, lastName: 1 });
contactSchema.index({ createdAt: -1 });

// Updated model name to match filename (lowercase, plural)
module.exports = mongoose.model('contacts', contactSchema);