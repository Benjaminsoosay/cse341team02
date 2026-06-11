const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  githubId: {
    type: String,
    unique: true,
    sparse: true
  },
  avatarUrl: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'editor', 'viewer', 'moderator'],
    default: 'user'
  },
  provider: {
    type: String,
    enum: ['local', 'google', 'github'],
    default: 'local'
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true  // This automatically adds createdAt and updatedAt
});

// Pre-save middleware to set provider based on which ID exists
userSchema.pre('save', function(next) {
  if (this.googleId) {
    this.provider = 'google';
  } else if (this.githubId) {
    this.provider = 'github';
  } else {
    this.provider = 'local';
  }
  next();
});

// Update lastLogin on each login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = Date.now();
  return this.save();
};

module.exports = mongoose.model('User', userSchema);