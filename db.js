const { MongoClient } = require('mongodb');
require('dotenv').config();

let _db;
let _client;

const initDb = (callback) => {
  if (_db) {
    console.log('Database is already initialized');
    return callback(null, _db);
  }
  
  MongoClient.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/event_management')
    .then((client) => {
      _client = client;
      _db = client.db(); // This returns the database object
      console.log(`✅ MongoDB Connected to database: ${_db.databaseName}`);
      callback(null, _db);
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err);
      callback(err);
    });
};

const getDb = () => {
  if (!_db) {
    throw Error('Database not initialized. Call initDb first.');
  }
  return _db;
};

const getClient = () => {
  if (!_client) {
    throw Error('MongoDB client not initialized');
  }
  return _client;
};

const closeDb = async () => {
  if (_client) {
    await _client.close();
    console.log('Database connection closed');
  }
};

module.exports = { initDb, getDb, getClient, closeDb };