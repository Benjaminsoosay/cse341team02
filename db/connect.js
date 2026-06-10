const { MongoClient } = require('mongodb');
require('dotenv').config();

let _db;
let _client;

const initDb = (callback) => {
  if (_db) {
    console.log('Database is already initialized');
    return callback(null, _db);
  }
  
  MongoClient.connect(process.env.MONGODB_URI)
    .then((client) => {
      _client = client;
      _db = client.db(process.env.DB_NAME || 'cse341_final');
      console.log('✅ Database connected successfully');
      callback(null, _db);
    })
    .catch((err) => {
      console.error('❌ Database connection failed:', err);
      callback(err);
    });
};

const getDb = () => {
  if (!_db) {
    throw Error('Database not initialized');
  }
  return _db;
};

const getClient = () => {
  if (!_client) {
    throw Error('Client not initialized');
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