// ============ AUTHENTICATION MIDDLEWARE ============

// Check if user is authenticated via OAuth
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized - Please login first' });
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ error: 'Forbidden - Admin access required' });
};

// Optional: Check if user has specific role
const hasRole = (...roles) => {
  return (req, res, next) => {
    if (req.isAuthenticated() && req.user && roles.includes(req.user.role)) {
      return next();
    }
    res.status(403).json({ error: `Forbidden - Required role: ${roles.join(', ')}` });
  };
};

// ============ PASSPORT CONFIGURATION ============

const configurePassport = (passport) => {
  const GoogleStrategy = require('passport-google-oauth20').Strategy;
  const GitHubStrategy = require('passport-github3').Strategy;
  const User = require('../models/User');

  // ============ GOOGLE OAuth Strategy ============
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback',
      passReqToCallback: true
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google profile received:', profile.id);
        
        // Get email from profile
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        
        if (!email) {
          return done(new Error('No email provided from Google'), null);
        }
        
        // Find user by Google ID
        let user = await User.findOne({ googleId: profile.id });
        
        if (!user) {
          // Try to find by email (existing user)
          user = await User.findOne({ email: email });
          
          if (user) {
            // Link Google ID to existing user
            user.googleId = profile.id;
            user.avatarUrl = user.avatarUrl || profile.photos?.[0]?.value;
            user.lastLogin = Date.now();
            await user.save();
            console.log(`Linked Google account to existing user: ${email}`);
          } else {
            // Create new user
            user = await User.create({
              name: profile.displayName,
              email: email,
              googleId: profile.id,
              username: profile.displayName.toLowerCase().replace(/\s/g, '') + Date.now(),
              avatarUrl: profile.photos?.[0]?.value || null,
              role: 'user',
              provider: 'google',
              lastLogin: Date.now()
            });
            console.log(`Created new user with Google: ${email}`);
          }
        } else {
          // Update last login
          user.lastLogin = Date.now();
          await user.save();
        }
        
        return done(null, user);
      } catch (error) {
        console.error('Google OAuth Error:', error);
        return done(error, null);
      }
    }));
    console.log('✅ Google OAuth strategy loaded');
  } else {
    console.log('⚠️ Google OAuth credentials not found - Google login disabled');
  }

  // ============ GITHUB OAuth Strategy ============
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL || '/auth/github/callback',
      scope: ['user:email'],
      passReqToCallback: true
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        console.log('GitHub profile received:', profile.id);
        
        // Get email from profile
        let email = null;
        if (profile.emails && profile.emails.length > 0) {
          email = profile.emails[0].value;
        }
        
        // Get username for display name if needed
        const displayName = profile.displayName || profile.username;
        
        // Find user by GitHub ID
        let user = await User.findOne({ githubId: profile.id });
        
        if (!user) {
          // Try to find by email if available
          if (email) {
            user = await User.findOne({ email: email });
            
            if (user) {
              // Link GitHub ID to existing user
              user.githubId = profile.id;
              user.avatarUrl = user.avatarUrl || profile.photos?.[0]?.value;
              user.username = user.username || profile.username;
              user.lastLogin = Date.now();
              await user.save();
              console.log(`Linked GitHub account to existing user: ${email}`);
            }
          }
          
          if (!user) {
            // Create new user
            const username = profile.username || displayName.toLowerCase().replace(/\s/g, '');
            user = await User.create({
              name: displayName,
              email: email || `${username}@github.user`,
              githubId: profile.id,
              username: username,
              avatarUrl: profile.photos?.[0]?.value || null,
              role: 'user',
              provider: 'github',
              lastLogin: Date.now()
            });
            console.log(`Created new user with GitHub: ${username}`);
          }
        } else {
          // Update last login and avatar
          user.lastLogin = Date.now();
          if (profile.photos?.[0]?.value) {
            user.avatarUrl = profile.photos[0].value;
          }
          await user.save();
        }
        
        return done(null, user);
      } catch (error) {
        console.error('GitHub OAuth Error:', error);
        return done(error, null);
      }
    }));
    console.log('✅ GitHub OAuth strategy loaded');
  } else {
    console.log('⚠️ GitHub OAuth credentials not found - GitHub login disabled');
  }

  // ============ SERIALIZATION ============
  // Serialize user - store only user ID in session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user - retrieve full user object from database
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id).select('-__v');
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      console.error('Deserialize User Error:', error);
      done(error, null);
    }
  });
};

// ============ HELPER FUNCTIONS ============

// Middleware to check if user is a specific provider type
const isProvider = (provider) => {
  return (req, res, next) => {
    if (req.isAuthenticated() && req.user && req.user.provider === provider) {
      return next();
    }
    res.status(403).json({ error: `This route requires ${provider} authentication` });
  };
};

// Middleware to ensure user owns the resource or is admin
const isOwnerOrAdmin = (getResourceUserId) => {
  return async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized - Please login first' });
    }
    
    if (req.user.role === 'admin') {
      return next();
    }
    
    try {
      const resourceUserId = await getResourceUserId(req);
      if (req.user.id === resourceUserId) {
        return next();
      }
      res.status(403).json({ error: 'Forbidden - You can only access your own resources' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
};

module.exports = { 
  isAuthenticated, 
  isAdmin, 
  hasRole,
  isProvider,
  isOwnerOrAdmin,
  configurePassport 
};