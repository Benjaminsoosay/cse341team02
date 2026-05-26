const dotenv = require('dotenv');
dotenv.config();
const { MongoClient } = require('mongodb');

let _db;
let _dbName = process.env.DB_NAME || 'cse341_final';

const initDb = (callback) => {
  if (_db) {
    console.log('Db is already initialized!');
    return callback(null, _db);
  }
  
  MongoClient.connect(process.env.MONGODB_URI)
    .then((client) => {
      _db = client.db(_dbName);
      console.log(`✅ Connected to database: ${_dbName}`);
      callback(null, _db);
    })
    .catch((err) => {
      console.error('❌ Database connection failed:', err);
      callback(err);
    });
};

// Alias for initDb to support both names
const connectToDb = initDb;

const getDb = () => {
  if (!_db) {
    throw Error('Db not initialized - call initDb first');
  }
  return _db;
};

const getClient = () => {
  if (!_client) {
    throw Error('Client not initialized - call initDb first');
  }
  return _client;
};

module.exports = {
  initDb,
  connectToDb,  // ✅ Export both names
  getDb,
  getClient
};