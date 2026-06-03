const express = require("express");
const session = require("express-session");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
const connectDB = require("./db");
const { OAuth2Client } = require('google-auth-library');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// IMPORTANT: Enable CORS for all routes
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: true
}));

app.options('*', cors());

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Session configuration (MUST be before OAuth routes)
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

// ===== GOOGLE OAUTH ROUTES =====
const googleClient = new OAuth2Client(
  '752967943648-jeqkv3acpdoqn6kf85v11d40ltjkd50q.apps.googleusercontent.com',
  process.env.GOOGLE_CLIENT_SECRET,
  'https://cse341team02.onrender.com/auth/google/callback'
);

// 1. Initiate Google login - THIS WAS MISSING
app.get('/auth/google', (req, res) => {
  const authUrl = googleClient.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email', 'openid'],
    prompt: 'consent'
  });
  res.redirect(authUrl);
});

// 2. Google OAuth callback - THIS WAS MISSING
app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).json({ error: 'No authorization code provided' });
  }
  
  try {
    const { tokens } = await googleClient.getToken(code);
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: '752967943648-jeqkv3acpdoqn6kf85v11d40ltjkd50q.apps.googleusercontent.com'
    });
    
    const payload = ticket.getPayload();
    
    req.session.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture
    };
    
    res.redirect('/api-docs');
  } catch (error) {
    console.error('OAuth error:', error);
    res.status(500).json({ error: 'Authentication failed', details: error.message });
  }
});

// 3. Check auth status
app.get('/auth/status', (req, res) => {
  if (req.session.user) {
    res.json({ authenticated: true, user: req.session.user });
  } else {
    res.json({ authenticated: false, user: null });
  }
});

// 4. Logout
app.get('/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Successfully logged out' });
  });
});

// ===== IMPORTANT: Serve swagger.json =====
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

// ===== OAuth2 Redirect Handler for Swagger UI =====
app.get('/api-docs/oauth2-redirect.html', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>OAuth2 Redirect</title>
    </head>
    <body>
      <script>
        (function () {
          var oauth2 = window.opener.swaggerUIRedirectOauth2;
          var sentState = oauth2.state;
          var receivedState = decodeURIComponent((new RegExp('[?|&]state=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\\+/g, '%20')) || null;
          if (receivedState !== sentState) {
            return;
          }
          oauth2.callback({
            code: (new RegExp('[?|&]code=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1],
            error: (new RegExp('[?|&]error=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1]
          });
        })();
      </script>
    </body>
    </html>
  `);
});

// ===== Swagger UI Setup =====
const swaggerOptions = {
  swaggerOptions: {
    url: '/swagger.json',
    urls: [{ url: '/swagger.json', name: 'API v1' }],
    docExpansion: 'list',
    defaultModelsExpandDepth: 3,
    tryItOutEnabled: true,
    filter: true,
    displayRequestDuration: true,
    oauth2RedirectUrl: 'https://cse341team02.onrender.com/api-docs/oauth2-redirect.html',
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

// Your routes
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
    version: "1.0.0",
  });
});

app.get("/login", (req, res) => {
  res.json({ 
    message: "Login page",
    note: "Please use OAuth authentication via Google",
    oauth_endpoints: { google: "/auth/google" }
  });
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

// Connect to MongoDB and start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📚 API Documentation: https://cse341team02.onrender.com/api-docs`);
    console.log(`📄 Swagger JSON: https://cse341team02.onrender.com/swagger.json`);
    console.log(`🏠 Home route: https://cse341team02.onrender.com`);
  });
}).catch(err => {
  console.error("Failed to connect to MongoDB:", err);
  process.exit(1);
});
