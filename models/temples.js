const mongoose = require('mongoose');

const templeSchema = new mongoose.Schema({
  temple_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  location: String,
  description: String,
  dedicated: String,
  additionalInfo: mongoose.Schema.Types.Mixed,
});

// Export a function that takes mongoose and returns the model
module.exports = (mongoose) => {
  return mongoose.model('Temple', templeSchema);
};