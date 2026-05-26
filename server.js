const express = require("express");
const session = require("express-session");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
const connectDB = require("./db");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// IMPORTANT: Enable CORS for all routes
app.use(cors({
  origin: '*', // Allow all origins for testing
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: true
}));

// Handle preflight requests
app.options('*', cors());

// Security Middleware (but don't block CORS)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" }
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static("public"));

// ===== IMPORTANT: Serve swagger.json at a dedicated endpoint =====
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json(swaggerDocument);
});

// Also serve it at /api/swagger.json as backup
app.get('/api/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json(swaggerDocument);
});

// ===== Swagger UI Setup - Point to the swagger.json endpoint =====
const swaggerOptions = {
  swaggerOptions: {
    url: '/swagger.json',  // This tells Swagger UI where to find your API spec
    urls: [
      {
        url: '/swagger.json',
        name: 'API v1'
      }
    ],
    docExpansion: 'list',
    defaultModelsExpandDepth: 3,
    tryItOutEnabled: true,
    filter: true,
    displayRequestDuration: true,
  },
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "CSE341 Team 02 - Final Project API Documentation",
  customfavIcon: "",
};

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));

// Optional: Add a redirect from /api-docs.json to your swagger.json
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

// Login route
app.get("/login", (req, res) => {
  res.json({ 
    message: "Login page",
    note: "Please use OAuth authentication via GitHub/Google",
    oauth_endpoints: {
      github: "/auth/github",
      google: "/auth/google"
    }
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
    console.log(`🔒 Environment: ${process.env.NODE_ENV || "development"}`);
  });
}).catch(err => {
  console.error("Failed to connect to MongoDB:", err);
  process.exit(1);
});