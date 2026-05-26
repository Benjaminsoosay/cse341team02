const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

// Initialize Google OAuth client
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

// Verify JWT token from Authorization header
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ 
      error: "Access denied. No token provided.",
      message: "Please provide a valid Bearer token in the Authorization header"
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(403).json({ 
        error: "Token expired",
        message: "Your session has expired. Please login again."
      });
    }
    return res.status(403).json({ 
      error: "Invalid token",
      message: "The provided token is invalid or malformed"
    });
  }
};

// Generate JWT token
const generateToken = (user) => {
  const tokenPayload = { 
    userId: user._id || user.id, 
    email: user.email, 
    name: user.name,
    role: user.role || 'user'
  };
  
  return jwt.sign(
    tokenPayload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

// Verify Google ID token
const verifyGoogleToken = async (idToken) => {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    return ticket.getPayload();
  } catch (err) {
    throw new Error("Invalid Google token");
  }
};

// Role-based middleware: Require admin
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ 
      error: "Admin access required",
      message: "You do not have permission to access this resource"
    });
  }
};

module.exports = {
  verifyToken,
  generateToken,
  verifyGoogleToken,
  requireAdmin
};