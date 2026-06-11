const passport = require('passport');
const GitHubStrategy = require('passport-github').Strategy;
const User = require('../models/User'); // Adjust path to your User model

// Serialize user for the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// GitHub Strategy configuration
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "https://cse341team02.onrender.com/users/auth/github/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists in database
      let user = await User.findOne({ githubId: profile.id });
      
      if (user) {
        // User exists, return them
        return done(null, user);
      }
      
      // Create new user
      user = await User.create({
        githubId: profile.id,
        name: profile.displayName || profile.username,
        email: profile.emails && profile.emails[0] ? profile.emails[0].value : null,
        username: profile.username,
        avatarUrl: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
        role: 'user', // Default role
        provider: 'github'
      });
      
      return done(null, user);
    } catch (error) {
      console.error('GitHub OAuth Error:', error);
      return done(error, null);
    }
  }
));

module.exports = passport;