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

app.use(cors({
  origin: ['https://cse341team02.onrender.com', 'http://localhost:8080', 'https://accounts.google.com'],
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

// OAuth redirect for Swagger
app.get('/api-docs/oauth2-redirect.html', (req, res) => {
  const redirectHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Swagger UI OAuth2 Redirect</title>
</head>
<body>
  <script>
    try {
      var authResult = window.location.hash.substring(1).split('&').reduce(function(res, item) {
        var parts = item.split('=');
        res[parts[0]] = parts[1];
        return res;
      }, {});
      
      window.opener.postMessage({
        type: 'oauth2',
        response: authResult
      }, '*');
      window.close();
    } catch(e) {
      console.error('OAuth redirect error:', e);
    }
  </script>
</body>
</html>`;
  res.send(redirectHtml);
});

// Swagger UI options
const swaggerOptions = {
  swaggerOptions: {
    url: '/swagger.json',
    oauth2RedirectUrl: 'https://cse341team02.onrender.com/api-docs/oauth2-redirect.html',
    oauth: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      appName: 'CSE341 Team 02',
      scopeSeparator: ' ',
      usePkceWithAuthorizationCodeGrant: false
    },
    docExpansion: 'list',
    defaultModelsExpandDepth: 3,
    tryItOutEnabled: true,
    filter: true,
    displayRequestDuration: true,
    requestInterceptor: (request) => {
      request.credentials = 'same-origin';
      return request;
    }
  },
  customCss: '.swagger-ui .topbar { display: none }',
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

app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).json({ error: 'No authorization code provided' });
  }
  
  try {
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
    
    // Call your internal /users/google-auth endpoint
    const userResponse = await fetch(`https://cse341team02.onrender.com/users/google-auth`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ token: tokens.id_token })
    });
    
    if (!userResponse.ok) {
      throw new Error('Failed to authenticate user with our API');
    }
    
    const userData = await userResponse.json();
    
    // Store token in session
    req.session.accessToken = tokens.access_token;
    req.session.user = userData.user || userData;
    
    // Send success response with token
    res.json({
      success: true,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
      user: userData.user || userData,
      message: 'Authentication successful'
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ 
      error: 'Authentication failed',
      message: error.message 
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

// Simple test token endpoint (for development)
app.post('/auth/test-token', (req, res) => {
  // This is a development endpoint - remove in production
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
    const collections = await db.listCollections().toArray();
    res.json({ 
      message: 'Database connected successfully',
      collections: collections.map(c => c.name),
      dbName: db.databaseName,
      status: 'Connected'
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      message: 'Database not initialized yet. Try again in a moment.'
    });
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
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  }
  
  console.log('Database initialized successfully');
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📚 API Documentation: https://cse341team02.onrender.com/api-docs`);
    console.log(`📄 Swagger JSON: https://cse341team02.onrender.com/swagger.json`);
    console.log(`🏠 Home route: https://cse341team02.onrender.com`);
    console.log(`🔒 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🗄️ Database: Connected to ${db.databaseName}`);
    console.log(`🔐 Google OAuth: https://cse341team02.onrender.com/auth/google`);
  });
});
