const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
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
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['admin', 'editor', 'moderator', 'viewer', 'user'],
    default: 'user'
  },
  favoriteColor: {
    type: String,
    default: 'Red'
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
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
  },
  lastLogin: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Create indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// Updated model name to match filename (lowercase, plural)
module.exports = mongoose.model('users', userSchema);