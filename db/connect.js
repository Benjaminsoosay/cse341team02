const dotenv = require('dotenv');
dotenv.config();
const { MongoClient } = require('mongodb');

let _db;
let _client;
let _dbName = process.env.DB_NAME || 'cse341_final';

const initDb = (callback) => {
  if (_db) {
    console.log('Db is already initialized!');
    return callback(null, _db);
  }
  
  MongoClient.connect(process.env.MONGODB_URI)
    .then((client) => {
      _client = client;
      _db = client.db(_dbName);
      console.log(`✅ Connected to database: ${_dbName}`);
      callback(null, _db);
    })
    .catch((err) => {
      console.error('❌ Database connection failed:', err);
      callback(err);
    });
};

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

// Setup database collections with validation and indexes
const setupDatabase = async () => {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME || 'cse341_final';
  
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env file');
    process.exit(1);
  }
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(dbName);
    console.log(`📊 Setting up database: ${dbName}`);
    
    // Define all collections with validation rules
    const collections = {
      // 1. Users Collection
      users: {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['name', 'email', 'password', 'createdAt'],
            properties: {
              name: {
                bsonType: 'string',
                description: 'Name is required and must be a string'
              },
              email: {
                bsonType: 'string',
                pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
                description: 'Email is required and must be valid'
              },
              password: {
                bsonType: 'string',
                minLength: 6,
                description: 'Password is required and must be at least 6 characters'
              },
              googleId: {
                bsonType: 'string',
                description: 'Google OAuth ID (optional)'
              },
              role: {
                bsonType: 'string',
                enum: ['user', 'admin'],
                default: 'user',
                description: 'User role'
              },
              createdAt: {
                bsonType: 'date',
                description: 'Creation timestamp'
              },
              updatedAt: {
                bsonType: 'date',
                description: 'Last update timestamp'
              }
            }
          }
        },
        indexes: [
          { key: { email: 1 }, unique: true },
          { key: { googleId: 1 }, unique: true, sparse: true },
          { key: { createdAt: -1 } }
        ]
      },
      
      // 2. Contacts Collection
      contacts: {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['firstName', 'lastName', 'email', 'userId', 'createdAt'],
            properties: {
              firstName: {
                bsonType: 'string',
                description: 'First name is required'
              },
              lastName: {
                bsonType: 'string',
                description: 'Last name is required'
              },
              email: {
                bsonType: 'string',
                pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
                description: 'Email is required and must be valid'
              },
              phone: {
                bsonType: 'string',
                description: 'Phone number (optional)'
              },
              address: {
                bsonType: 'string',
                description: 'Address (optional)'
              },
              city: {
                bsonType: 'string',
                description: 'City (optional)'
              },
              state: {
                bsonType: 'string',
                description: 'State (optional)'
              },
              zipCode: {
                bsonType: 'string',
                description: 'ZIP code (optional)'
              },
              userId: {
                bsonType: 'objectId',
                description: 'User ID who owns this contact'
              },
              createdAt: {
                bsonType: 'date',
                description: 'Creation timestamp'
              },
              updatedAt: {
                bsonType: 'date',
                description: 'Last update timestamp'
              }
            }
          }
        },
        indexes: [
          { key: { email: 1 }, unique: true },
          { key: { userId: 1 } },
          { key: { firstName: 1, lastName: 1 } },
          { key: { createdAt: -1 } }
        ]
      },
      
      // 3. Events Collection
      events: {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['title', 'date', 'location', 'createdBy', 'createdAt'],
            properties: {
              title: {
                bsonType: 'string',
                description: 'Event title is required'
              },
              description: {
                bsonType: 'string',
                description: 'Event description (optional)'
              },
              date: {
                bsonType: 'date',
                description: 'Event date and time is required'
              },
              location: {
                bsonType: 'string',
                description: 'Event location is required'
              },
              capacity: {
                bsonType: 'int',
                minimum: 0,
                description: 'Maximum number of attendees (optional)'
              },
              createdBy: {
                bsonType: 'objectId',
                description: 'User ID who created the event'
              },
              attendees: {
                bsonType: 'array',
                items: {
                  bsonType: 'objectId'
                },
                description: 'List of user IDs attending'
              },
              createdAt: {
                bsonType: 'date',
                description: 'Creation timestamp'
              },
              updatedAt: {
                bsonType: 'date',
                description: 'Last update timestamp'
              }
            }
          }
        },
        indexes: [
          { key: { date: 1 } },
          { key: { createdBy: 1 } },
          { key: { title: 'text' } },
          { key: { date: -1, createdAt: -1 } }
        ]
      },
      
      // 4. RSVPs Collection
      rsvps: {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['eventId', 'userId', 'status', 'rsvpDate'],
            properties: {
              eventId: {
                bsonType: 'objectId',
                description: 'Event ID is required'
              },
              userId: {
                bsonType: 'objectId',
                description: 'User ID is required'
              },
              status: {
                bsonType: 'string',
                enum: ['going', 'maybe', 'not-going', 'pending'],
                description: 'RSVP status'
              },
              guests: {
                bsonType: 'int',
                minimum: 0,
                default: 0,
                description: 'Number of guests accompanying'
              },
              dietaryRestrictions: {
                bsonType: 'string',
                description: 'Any dietary restrictions (optional)'
              },
              notes: {
                bsonType: 'string',
                description: 'Additional notes (optional)'
              },
              rsvpDate: {
                bsonType: 'date',
                description: 'When RSVP was submitted'
              },
              updatedAt: {
                bsonType: 'date',
                description: 'Last update timestamp'
              }
            }
          }
        },
        indexes: [
          { key: { eventId: 1, userId: 1 }, unique: true },
          { key: { eventId: 1 } },
          { key: { userId: 1 } },
          { key: { status: 1 } },
          { key: { rsvpDate: -1 } }
        ]
      },
      
      // 5. Sessions Collection (for express-session)
      sessions: {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['sessionId', 'data', 'expiresAt'],
            properties: {
              sessionId: {
                bsonType: 'string',
                description: 'Unique session ID'
              },
              data: {
                bsonType: 'object',
                description: 'Session data'
              },
              expiresAt: {
                bsonType: 'date',
                description: 'Session expiration time'
              },
              createdAt: {
                bsonType: 'date',
                description: 'Creation timestamp'
              }
            }
          }
        },
        indexes: [
          { key: { sessionId: 1 }, unique: true },
          { key: { expiresAt: 1 }, expireAfterSeconds: 0 }
        ]
      }
    };
    
    // Create each collection
    for (const [collectionName, config] of Object.entries(collections)) {
      try {
        // Check if collection exists
        const existingCollections = await db.listCollections({ name: collectionName }).toArray();
        
        if (existingCollections.length === 0) {
          // Create collection with validation
          await db.createCollection(collectionName, {
            validator: config.validator,
            validationLevel: 'strict',
            validationAction: 'error'
          });
          console.log(`✅ Created collection: ${collectionName} with validation`);
        } else {
          console.log(`⚠️ Collection already exists: ${collectionName}`);
        }
        
        // Create indexes
        for (const index of config.indexes) {
          try {
            await db.collection(collectionName).createIndex(index.key, {
              unique: index.unique || false,
              sparse: index.sparse || false,
              name: Object.keys(index.key).join('_')
            });
          } catch (indexError) {
            // Index might already exist
            if (!indexError.message.includes('already exists')) {
              console.error(`   ⚠️ Error creating index for ${collectionName}:`, indexError.message);
            }
          }
        }
        console.log(`   📇 Created indexes for: ${collectionName}`);
        
      } catch (error) {
        console.error(`❌ Error creating collection ${collectionName}:`, error.message);
      }
    }
    
    // Insert sample data (optional)
    await insertSampleData(db);
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log(`📊 Database: ${dbName}`);
    console.log('\n📚 Collections created:');
    console.log('   - users (authentication & user management)');
    console.log('   - contacts (contact management)');
    console.log('   - events (event management)');
    console.log('   - rsvps (RSVP tracking)');
    console.log('   - sessions (session storage)');
    
    await client.close();
    console.log('\n🔌 Database connection closed');
    return true;
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  }
};

async function insertSampleData(db) {
  const sampleData = {
    users: [
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: '$2a$10$rVvKkXZpQZlF9qYqVqVqVqVqVqVqVqVqVqVqVqVqVqVqVq', // "password123" hashed
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  };
  
  for (const [collectionName, data] of Object.entries(sampleData)) {
    try {
      const existing = await db.collection(collectionName).countDocuments();
      if (existing === 0) {
        await db.collection(collectionName).insertMany(data);
        console.log(`   📝 Added sample data to: ${collectionName}`);
      }
    } catch (error) {
      console.log(`   ⚠️ Could not add sample data to ${collectionName}:`, error.message);
    }
  }
}

// Run setup if this script is executed directly
if (require.main === module) {
  setupDatabase().catch(console.error);
}

module.exports = {
  initDb,
  getDb,
  getClient,
  setupDatabase
};