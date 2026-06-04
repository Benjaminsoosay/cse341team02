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

// IMPORTANT: Enable CORS for all routes with proper configuration
app.use(cors({
  origin: ['https://cse341team02.onrender.com', 'http://localhost:8080', 'https://accounts.google.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: true
}));

// Handle preflight requests
app.options('*', cors());

// Security Middleware (but don't block CORS)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" },
  contentSecurityPolicy: false // Allows Swagger UI to work properly
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

// ===== CRITICAL: Serve oauth2-redirect.html for Swagger OAuth =====
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

// ===== Swagger UI Setup with OAuth Configuration =====
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

// Optional: Add a redirect from /api-docs.json to your swagger.json
app.get('/api-docs.json', (req, res) => {
  res.redirect('/swagger.json');
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 
