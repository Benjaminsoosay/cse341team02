const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');

let _db = null;

const initDb = async (callback) => {
  if (_db) {
    console.log('Database already initialized');
    return callback(null, _db);
  }
  
  try {
    const client = new MongoClient(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
    });
    
    await client.connect();
    _db = client.db();
    
    console.log('✅ MongoDB connected successfully');
    callback(null, _db);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    callback(error, null);
  }
};

const getDb = () => {
  if (!_db) {
    throw new Error('Database not initialized');
  }
  return _db;
};

module.exports = { initDb, getDb };