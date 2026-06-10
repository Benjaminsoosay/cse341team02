const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'cse341_final';

// Initialize database connection
const initAllConnections = async () => {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    
    // Connect with database name in options
    await mongoose.connect(MONGODB_URI, {
      dbName: DB_NAME,
    });
    
    console.log(`✅ Mongoose connected to database: ${mongoose.connection.name}`);
    console.log(`📍 Host: ${mongoose.connection.host}`);
    return true;
  } catch (error) {
    console.error('❌ Mongoose connection failed:', error.message);
    throw error;
  }
};

// Close database connection
const closeAllConnections = async () => {
  try {
    await mongoose.disconnect();
    console.log('🔒 Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error.message);
    throw error;
  }
};

// Get connection status
const getConnectionStatus = () => {
  return {
    mongoose: {
      readyState: mongoose.connection.readyState,
      state: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      dbName: mongoose.connection.name,
      host: mongoose.connection.host
    }
  };
};

module.exports = {
  initAllConnections,
  closeAllConnections,
  getConnectionStatus
};