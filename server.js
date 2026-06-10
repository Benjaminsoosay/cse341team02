// DNS FIX for Windows Node.js v24+ - Forces DNS resolution
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

// Import routes
const contactsRoutes = require('./routes/contacts');
const eventsRoutes = require('./routes/events');
const rsvpsRoutes = require('./routes/rsvps');
const usersRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

// ============ MIDDLEWARE ============
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust proxy - Required for Render HTTPS
app.set('trust proxy', 1);

// Session middleware for OAuth (Week 06 requirement)
app.use(session({
  secret: process.env.SESSION_SECRET || 'mysecret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // true on Render (HTTPS)
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// ============ SWAGGER DOCUMENTATION ============
// Required at /api-docs for Week 05 & 06
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Serve swagger.json file
app.get('/swagger.json', (req, res) => {
  res.json(swaggerDocument);
});

// ============ ROUTES ============
// CRUD operations for all 4 collections
app.use('/contacts', contactsRoutes);
app.use('/events', eventsRoutes);
app.use('/rsvps', rsvpsRoutes);
app.use('/users', usersRoutes);

// ============ HOME ROUTE ============
app.get('/', (req, res) => {
  res.json({
    message: 'Final Project API is running',
    documentation: '/api-docs',
    collections: ['contacts', 'events', 'rsvps', 'users'],
    status: '✅ Server is active',
    environment: process.env.NODE_ENV || 'development'
  });
});

// ============ HEALTH CHECK ============
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    server: 'running',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ============ ERROR HANDLING (Week 05 requirement) ============

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.url}`,
    availableRoutes: '/api-docs for documentation'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ============ DATABASE CONNECTION & START SERVER ============

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'cse341_final';

const startServer = async () => {
  try {
    // Check if MONGODB_URI exists
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('🔄 Connecting to MongoDB...');
    console.log(`📍 Using database: ${DB_NAME}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      dbName: DB_NAME,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ Mongoose connected to database: ${mongoose.connection.name}`);
    console.log(`📍 Host: ${mongoose.connection.host}`);
    console.log(`📊 Connection state: ${mongoose.connection.readyState}`);

    // Start server
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📚 Swagger documentation: http://localhost:${PORT}/api-docs`);
      if (process.env.NODE_ENV === 'production') {
        console.log(`🌐 Live URL: https://cse341team02.onrender.com`);
      }
      console.log(`🏠 Home: http://localhost:${PORT}/`);
      console.log(`💚 Health check: http://localhost:${PORT}/health`);
      console.log(`\n📋 Available API Endpoints:`);
      console.log(`   GET    POST    /contacts`);
      console.log(`   GET    POST    /events`);
      console.log(`   GET    POST    /rsvps (OAuth protected POST/PUT/DELETE)`);
      console.log(`   GET    POST    /users  (OAuth protected POST/PUT/DELETE)`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    if (error.message.includes('querySrv') || error.message.includes('ECONNREFUSED')) {
      console.error('\n⚠️ DNS resolution error. Try these fixes:');
      console.error('   1. Add to your hosts file: 127.0.0.1 cluster0.za3j8rl.mongodb.net');
      console.error('   2. Or use the legacy MongoDB connection string (non-SRV)');
      console.error('   3. Or flush DNS: ipconfig /flushdns');
    }
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⚠️ Received SIGINT. Shutting down gracefully...');
  try {
    await mongoose.disconnect();
    console.log('🔒 Database connection closed');
  } catch (error) {
    console.error('❌ Error closing connection:', error.message);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️ Received SIGTERM. Shutting down gracefully...');
  try {
    await mongoose.disconnect();
    console.log('🔒 Database connection closed');
  } catch (error) {
    console.error('❌ Error closing connection:', error.message);
  }
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;