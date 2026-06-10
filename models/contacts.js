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
    type: Date,
    default: null
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    country: { type: String, default: '' },
    postalCode: { type: String, default: '' }
  },
  company: {
    type: String,
    trim: true,
    default: ''
  },
  jobTitle: {
    type: String,
    trim: true,
    default: ''
  },
  website: {
    type: String,
    trim: true,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: {
    createdAt: true,
    updatedAt: true
  }
});

// Indexes for better query performance
contactSchema.index({ email: 1 });
contactSchema.index({ firstName: 1, lastName: 1 });
contactSchema.index({ createdAt: -1 });
contactSchema.index({ isActive: 1 });
contactSchema.index({ createdBy: 1, createdAt: -1 });

// Add a compound index for common queries (active contacts sorted by creation)
contactSchema.index({ isActive: 1, createdAt: -1 });

// Optional: Add text search index if needed for search functionality
// contactSchema.index({ firstName: 'text', lastName: 'text', email: 'text' });

// Virtual for full name
contactSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are included in JSON output
contactSchema.set('toJSON', { virtuals: true });
contactSchema.set('toObject', { virtuals: true });

// Pre-save middleware to update updatedAt (though timestamps handles this)
contactSchema.pre('save', function(next) {
  // Add any pre-save logic here if needed
  // For example: sanitize phone number or format email
  if (this.email) {
    this.email = this.email.toLowerCase();
  }
  next();
});

// Pre-update middleware to update updatedAt
contactSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Export with model name matching the collection name
module.exports = mongoose.model('Contact', contactSchema);