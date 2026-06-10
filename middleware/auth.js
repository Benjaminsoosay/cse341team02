// Check if user is authenticated via OAuth
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized - Please login first' });
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ error: 'Forbidden - Admin access required' });
};

// Passport configuration for BOTH Google and GitHub OAuth
const configurePassport = (passport) => {
  const GoogleStrategy = require('passport-google-oauth20').Strategy;
  const GitHubStrategy = require('passport-github3').Strategy;
  const User = require('../models/User');

  // ============ GOOGLE OAuth Strategy ============
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/users/auth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        
        if (!user) {
          user = await User.findOne({ email: profile.emails[0].value });
          
          if (user) {
            user.googleId = profile.id;
            await user.save();
          } else {
            user = await User.create({
              name: profile.displayName,
              email: profile.emails[0].value,
              googleId: profile.id,
              role: 'user'
            });
          }
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
      callbackURL: process.env.GITHUB_CALLBACK_URL || '/users/auth/github/callback',
      scope: ['user:email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Get email from profile
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        
        let user = await User.findOne({ githubId: profile.id });
        
        if (!user) {
          // Try to find by email
          if (email) {
            user = await User.findOne({ email: email });
            
            if (user) {
              // Link GitHub ID to existing user
              user.githubId = profile.id;
              await user.save();
            }
          }
          
          if (!user) {
            // Create new user
            user = await User.create({
              name: profile.displayName || profile.username,
              email: email || `${profile.username}@github.user`,
              githubId: profile.id,
              role: 'user'
            });
          }
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

  // Serialize user - store only user ID in session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user - retrieve full user object from database
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      console.error('Deserialize User Error:', error);
      done(error, null);
    }
  });
};

module.exports = { isAuthenticated, isAdmin, configurePassport };