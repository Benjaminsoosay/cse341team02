const mongodb = require("../db/connect");
const { ObjectId } = require("mongodb");
const { generateToken, verifyGoogleToken } = require("../middleware/auth");

// Google OAuth login/signup
const googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ error: "idToken is required" });
    }
    
    // Verify Google token
    const payload = await verifyGoogleToken(idToken);
    
    const db = mongodb.getDb();  // ✅ REMOVED .db() - getDb already returns the database
    const usersCollection = db.collection("users");
    
    // Check if user exists
    let user = await usersCollection.findOne({ email: payload.email });
    
    if (!user) {
      // Create new user (7+ fields)
      const newUser = {
        googleId: payload.sub,
        name: payload.name,
        email: payload.email,
        avatar: payload.picture,
        role: "user",
        createdAt: new Date(),
        lastLogin: new Date(),
        isActive: true,
        emailVerified: payload.email_verified || false
      };
      
      const result = await usersCollection.insertOne(newUser);
      user = { ...newUser, _id: result.insertedId };
    } else {
      // Update last login
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { lastLogin: new Date() } }
      );
    }
    
    // Generate JWT
    const token = generateToken(user);
    
    res.status(200).json({
      message: "Authentication successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role
      }
    });
    
  } catch (err) {
    console.error("Google auth error:", err);
    res.status(401).json({ error: "Authentication failed", message: err.message });
  }
};

// GET all users (admin only - protected)
const getAllUsers = async (req, res) => {
  try {
    const result = await mongodb
      .getDb()  // ✅ REMOVED .db()
      .collection("users")
      .find()
      .project({ password: 0 }) // Don't return sensitive fields
      .toArray();
    
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve users", message: err.message });
  }
};

// GET single user
const getSingleUser = async (req, res) => {
  const userId = req.params.id;
  
  if (!ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid user ID format" });
  }
  
  try {
    const result = await mongodb
      .getDb()  // ✅ REMOVED .db()
      .collection("users")
      .findOne({ _id: new ObjectId(userId) }, { projection: { password: 0 } });
    
    if (!result) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve user", message: err.message });
  }
};

// UPDATE user
const updateUser = async (req, res) => {
  const userId = req.params.id;
  
  if (!ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid user ID format" });
  }
  
  const { name, avatar, role, isActive } = req.body;
  
  const updateData = {};
  if (name) updateData.name = name;
  if (avatar) updateData.avatar = avatar;
  if (role) updateData.role = role;
  if (isActive !== undefined) updateData.isActive = isActive;
  updateData.updatedAt = new Date();
  
  try {
    const response = await mongodb
      .getDb()  // ✅ REMOVED .db()
      .collection("users")
      .updateOne(
        { _id: new ObjectId(userId) },
        { $set: updateData }
      );
    
    if (response.matchedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.status(200).json({ message: "User updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Update failed", message: err.message });
  }
};

// DELETE user
const deleteUser = async (req, res) => {
  const userId = req.params.id;
  
  if (!ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid user ID format" });
  }
  
  try {
    const response = await mongodb
      .getDb()  // ✅ REMOVED .db()
      .collection("users")
      .deleteOne({ _id: new ObjectId(userId) });
    
    if (response.deletedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed", message: err.message });
  }
};

// Get current user profile (from JWT)
const getMyProfile = async (req, res) => {
  try {
    const user = await mongodb
      .getDb()  // ✅ REMOVED .db()
      .collection("users")
      .findOne({ _id: new ObjectId(req.user.userId) }, { projection: { password: 0 } });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to get profile", message: err.message });
  }
};

module.exports = {
  googleAuth,
  getAllUsers,
  getSingleUser,
  updateUser,
  deleteUser,
  getMyProfile
};