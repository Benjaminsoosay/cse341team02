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
    
    const payload = await verifyGoogleToken(idToken);
    const db = mongodb.getDb();
    const usersCollection = db.collection("users");
    
    let user = await usersCollection.findOne({ email: payload.email });
    
    if (!user) {
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
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { lastLogin: new Date() } }
      );
    }
    
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

// CREATE new user (manual POST endpoint for /users)
const createUser = async (req, res) => {
  try {
    const { email, name, avatar, googleId, role } = req.body;
    
    // Validate required fields
    if (!email || !name) {
      return res.status(400).json({ 
        error: "Validation failed", 
        message: "Email and name are required fields" 
      });
    }
    
    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: "Validation failed", 
        message: "Invalid email format" 
      });
    }
    
    // Check if user already exists
    const existingUser = await mongodb
      .getDb()
      .collection("users")
      .findOne({ email });
    
    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }
    
    // Create new user object
    const newUser = {
      email,
      name,
      avatar: avatar || "",
      googleId: googleId || `manual_${Date.now()}`,
      role: role || "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: new Date(),
      isActive: true,
      emailVerified: false
    };
    
    const result = await mongodb
      .getDb()
      .collection("users")
      .insertOne(newUser);
    
    res.status(201).json({ 
      message: "User created successfully",
      user: { ...newUser, _id: result.insertedId }
    });
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ error: "Failed to create user", message: err.message });
  }
};

// GET all users
const getAllUsers = async (req, res) => {
  try {
    const result = await mongodb
      .getDb()
      .collection("users")
      .find()
      .project({ password: 0 })
      .toArray();
    
    res.status(200).json(result);
  } catch (err) {
    console.error("Get all users error:", err);
    res.status(500).json({ error: "Failed to retrieve users", message: err.message });
  }
};

// GET single user by ID
const getSingleUser = async (req, res) => {
  const userId = req.params.id;
  
  if (!ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid user ID format" });
  }
  
  try {
    const result = await mongodb
      .getDb()
      .collection("users")
      .findOne({ _id: new ObjectId(userId) }, { projection: { password: 0 } });
    
    if (!result) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.status(200).json(result);
  } catch (err) {
    console.error("Get single user error:", err);
    res.status(500).json({ error: "Failed to retrieve user", message: err.message });
  }
};

// UPDATE user - FIXED VERSION
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
  
  if (Object.keys(updateData).length === 1 && updateData.updatedAt) {
    return res.status(400).json({ error: "No valid fields provided for update" });
  }
  
  try {
    const result = await mongodb
      .getDb()
      .collection("users")
      .findOneAndUpdate(
        { _id: new ObjectId(userId) },
        { $set: updateData },
        { returnDocument: 'after' }
      );
    
    // FIX: Check if result exists and has value property
    if (!result || !result.value) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.status(200).json(result.value);
  } catch (err) {
    console.error("Update user error:", err);
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
      .getDb()
      .collection("users")
      .deleteOne({ _id: new ObjectId(userId) });
    
    if (response.deletedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.status(200).json({ 
      message: "User deleted successfully",
      deletedCount: response.deletedCount
    });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: "Delete failed", message: err.message });
  }
};

// Get current user profile (from JWT)
const getMyProfile = async (req, res) => {
  try {
    const user = await mongodb
      .getDb()
      .collection("users")
      .findOne({ _id: new ObjectId(req.user.userId) }, { projection: { password: 0 } });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.status(200).json(user);
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ error: "Failed to get profile", message: err.message });
  }
};

// GET user by email
const getUserByEmail = async (req, res) => {
  const { email } = req.params;
  
  if (!email) {
    return res.status(400).json({ error: "Email parameter is required" });
  }
  
  try {
    const result = await mongodb
      .getDb()
      .collection("users")
      .findOne({ email }, { projection: { password: 0 } });
    
    if (!result) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.status(200).json(result);
  } catch (err) {
    console.error("Get user by email error:", err);
    res.status(500).json({ error: "Failed to retrieve user", message: err.message });
  }
};

module.exports = {
  googleAuth,
  createUser,
  getAllUsers,
  getSingleUser,
  updateUser,
  deleteUser,
  getMyProfile,
  getUserByEmail
};