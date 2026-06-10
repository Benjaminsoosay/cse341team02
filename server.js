const express = require("express");
const session = require("express-session");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
const { initDb, getDb } = require("./db/connect");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Verify MongoDB URI is loaded (without exposing it)
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in environment variables');
  console.error('Please set MONGODB_URI in your .env file');
  process.exit(1);
}

console.log('✅ MongoDB configuration loaded');
console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);

app.use(cors({
  origin: ['https://cse341team02.onrender.com', 'http://localhost:8080', 'http://localhost:3000', 'https://accounts.google.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: true
}));

app.options('*', cors());

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" },
  contentSecurityPolicy: false
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Serve swagger.json
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json(swaggerDocument);
});

app.get('/api/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json(swaggerDocument);
});

// Swagger UI options
const swaggerOptions = {
  swaggerOptions: {
    url: '/swagger.json',
    docExpansion: 'list',
    defaultModelsExpandDepth: 3,
    tryItOutEnabled: true,
    filter: true,
    displayRequestDuration: true,
    authAction: {},
    authorizations: {},
    displayOperationId: false,
    tagsSorter: 'alpha',
    operationsSorter: 'alpha'
  },
  customCss: '.swagger-ui .topbar { display: none } .authorization-btn { display: none !important; } .auth-wrapper { display: none !important; }',
  customSiteTitle: "CSE341 Team 02 - Final Project API Documentation",
};

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));

app.get('/api-docs.json', (req, res) => {
  res.redirect('/swagger.json');
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later."
});
app.use("/api", limiter);

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default-secret-key-change-this",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// ===== GOOGLE OAUTH ENDPOINTS =====
app.get('/auth/google', (req, res) => {
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'https://cse341team02.onrender.com/auth/google/callback';
  const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
    access_type: 'offline',
    prompt: 'consent'
  });
  res.redirect(authUrl);
});

// OAuth Callback - Creates user directly in database
app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).json({ error: 'No authorization code provided' });
  }
  
  try {
    const db = getDb();
    if (!db) {
      throw new Error('Database not initialized yet');
    }
    
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'https://cse341team02.onrender.com/auth/google/callback',
        grant_type: 'authorization_code'
      })
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      throw new Error(errorData.error_description || 'Failed to exchange code for tokens');
    }
    
    const tokens = await tokenResponse.json();
    
    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${tokens.access_token}` }
    });
    const userInfo = await userInfoResponse.json();
    
    // Create or update user in database
    const usersCollection = db.collection('users');
    
    let user = await usersCollection.findOne({ email: userInfo.email });
    
    if (!user) {
      const newUser = {
        email: userInfo.email,
        name: userInfo.name,
        avatar: userInfo.picture,
        googleId: userInfo.id,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date()
      };
      
      const result = await usersCollection.insertOne(newUser);
      user = { _id: result.insertedId, ...newUser };
      console.log(`✅ New user created: ${userInfo.email}`);
    } else {
      await usersCollection.updateOne(
        { email: userInfo.email },
        { 
          $set: { 
            name: userInfo.name,
            avatar: userInfo.picture,
            lastLogin: new Date(),
            updatedAt: new Date()
          } 
        }
      );
      user.lastLogin = new Date();
      console.log(`🔄 User updated: ${userInfo.email}`);
    }
    
    req.session.accessToken = tokens.access_token;
    req.session.user = user;
    req.session.userId = user._id;
    
    res.json({
      success: true,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role
      },
      message: 'Authentication successful'
    });
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ 
      error: 'Authentication failed',
      message: error.message,
      details: error.toString()
    });
  }
});

// Get current authenticated user
app.get('/auth/status', (req, res) => {
  if (req.session.user) {
    res.json({ 
      authenticated: true, 
      user: req.session.user,
      access_token: req.session.accessToken 
    });
  } else {
    res.json({ authenticated: false, user: null });
  }
});

// Logout endpoint
app.get('/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout', message: err.message });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// Development test token endpoint
app.post('/auth/test-token', (req, res) => {
  res.json({
    access_token: 'test-token-for-development',
    token_type: 'Bearer',
    expires_in: 3600,
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'admin'
    }
  });
});

// Routes
const contactsRoutes = require("./routes");
const usersRoutes = require("./routes/users");
const eventsRoutes = require("./routes/events");
const rsvpsRoutes = require("./routes/rsvps");

app.use("/contacts", contactsRoutes);
app.use("/users", usersRoutes);
app.use("/events", eventsRoutes);
app.use("/rsvps", rsvpsRoutes);

// Home route
app.get("/", (req, res) => {
  res.json({
    message: "Final Project API - Welcome to the Contacts Management System",
    documentation: "/api-docs",
    swaggerJson: "/swagger.json",
    endpoints: {
      contacts: "/contacts",
      users: "/users",
      events: "/events",
      rsvps: "/rsvps",
    },
    auth: {
      google_login: "/auth/google",
      auth_status: "/auth/status",
      logout: "/auth/logout"
    },
    version: "1.0.0",
  });
});

app.get("/login", (req, res) => {
  res.json({ 
    message: "Login page",
    note: "Please use OAuth authentication via Google",
    oauth_endpoints: {
      google: "/auth/google",
      status: "/auth/status"
    }
  });
});

// Test database endpoint
app.get('/test-db', async (req, res) => {
  try {
    const db = getDb();
    if (!db) {
      return res.status(500).json({ 
        error: 'Database not initialized',
        message: 'Database connection not established yet'
      });
    }
    
    const collections = await db.listCollections().toArray();
    
    const counts = {};
    for (const collection of collections) {
      counts[collection.name] = await db.collection(collection.name).countDocuments();
    }
    
    res.json({ 
      success: true,
      message: 'Database connected successfully',
      databaseName: db.databaseName,
      collections: collections.map(c => c.name),
      counts: counts,
      status: 'Connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      message: 'Database error occurred',
      timestamp: new Date().toISOString()
    });
  }
});

// Setup collections endpoint
app.post('/setup-collections', async (req, res) => {
  try {
    const db = getDb();
    if (!db) {
      return res.status(500).json({ error: 'Database not initialized' });
    }
    
    const collections = ['contacts', 'users', 'events', 'rsvps'];
    const results = {};
    
    for (const collectionName of collections) {
      const exists = await db.listCollections({ name: collectionName }).hasNext();
      if (!exists) {
        await db.createCollection(collectionName);
        results[collectionName] = 'Created';
      } else {
        results[collectionName] = 'Already exists';
      }
    }
    
    res.json({
      success: true,
      message: 'Collections setup completed',
      results: results
    });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Public users endpoint (development only)
app.get('/public-users', async (req, res) => {
  try {
    const db = getDb();
    if (!db) {
      return res.status(500).json({ error: 'Database not initialized' });
    }
    
    const users = await db.collection('users').find({}).toArray();
    res.json({
      count: users.length,
      users: users.map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: "Route not found",
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error stack:", err.stack);
  res.status(err.status || 500).json({
    error: "Something went wrong!",
    message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
});

// Initialize database and start server
initDb((err, db) => {
  if (err) {
    console.error('❌ Failed to connect to MongoDB:', err);
    console.error('Please check your MongoDB connection string and network settings');
    process.exit(1);
  }
  
  console.log('✅ Database initialized successfully');
  console.log(`📊 Connected to database: ${db.databaseName}`);
  
  // Auto-create collections if they don't exist
  const setupCollections = async () => {
    try {
      const collections = ['contacts', 'users', 'events', 'rsvps'];
      for (const collectionName of collections) {
        const exists = await db.listCollections({ name: collectionName }).hasNext();
        if (!exists) {
          await db.createCollection(collectionName);
          console.log(`✅ Created collection: ${collectionName}`);
        } else {
          console.log(`📁 Collection exists: ${collectionName}`);
        }
      }
      console.log('🎯 All collections ready');
    } catch (error) {
      console.error('⚠️ Error setting up collections:', error.message);
    }
  };
  
  setupCollections();
  
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    console.log(`📄 Swagger JSON: http://localhost:${PORT}/swagger.json`);
    console.log(`🏠 Home route: http://localhost:${PORT}`);
    console.log(`🔒 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🗄️ Database: Connected to ${db.databaseName}`);
    console.log(`🔐 Google OAuth: http://localhost:${PORT}/auth/google`);
    console.log(`👥 Public Users: http://localhost:${PORT}/public-users`);
    console.log(`🧪 Test Database: http://localhost:${PORT}/test-db`);
    console.log(`⚙️ Setup Collections: http://localhost:${PORT}/setup-collections`);
    console.log(`\n✅ API is ready to use!`);
  });
});