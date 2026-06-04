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

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later."
});
app.use("/api", limiter);

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

const contactsRoutes = require("./routes");
const usersRoutes = require("./routes/users");
const eventsRoutes = require("./routes/events");
const rsvpsRoutes = require("./routes/rsvps");

app.use("/contacts", contactsRoutes);
app.use("/users", usersRoutes);
app.use("/events", eventsRoutes);
app.use("/rsvps", rsvpsRoutes);

app.get("/auth/google", (req, res) => {
  res.json({ message: "Google OAuth login endpoint", redirect: "/auth/google/callback" });
});

app.get("/auth/google/callback", (req, res) => {
  res.json({ message: "Google OAuth callback endpoint" });
});

app.get("/auth/status", (req, res) => {
  res.json({ authenticated: false, user: null });
});

app.get("/auth/logout", (req, res) => {
  req.session.destroy();
  res.json({ message: "Logged out successfully" });
});

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
    oauth_endpoints: {
      google: "/auth/google"
    }
  });
});

app.use((req, res) => {
  res.status(404).json({ 
    error: "Route not found",
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

app.use((err, req, res, next) => {
  console.error("Error stack:", err.stack);
  res.status(err.status || 500).json({
    error: "Something went wrong!",
    message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
});

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
