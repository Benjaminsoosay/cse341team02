const User = require("../models/users");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { generateToken, verifyGoogleToken } = require("../middleware/auth");

// Google OAuth login/signup
const googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ error: "idToken is required" });
    }
    
    const payload = await verifyGoogleToken(idToken);
    
    let user = await User.findOne({ email: payload.email });
    
    if (!user) {
      // Create new user
      user = new User({
        firstName: payload.given_name || payload.name.split(' ')[0] || '',
        lastName: payload.family_name || payload.name.split(' ').slice(1).join(' ') || '',
        email: payload.email,
        googleId: payload.sub,
        avatar: payload.picture,
        role: "user",
        createdAt: new Date(),
        lastLogin: new Date(),
        isActive: true,
        emailVerified: payload.email_verified || false
      });
      
      await user.save();
    } else {
      // Update existing user
      user.lastLogin = new Date();
      await user.save();
    }
    
    const token = generateToken(user);
    
    res.status(200).json({
      message: "Authentication successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
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
    const { firstName, lastName, email, password, role, favoriteColor, phone, company, jobTitle } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ 
        error: "Validation failed", 
        message: "First name, last name, email, and password are required fields" 
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
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: role || "user",
      favoriteColor: favoriteColor || "Red",
      phone: phone || "",
      company: company || "",
      jobTitle: jobTitle || "",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: new Date(),
      isActive: true
    });
    
    const savedUser = await newUser.save();
    
    // Remove password from response
    const userResponse = savedUser.toObject();
    delete userResponse.password;
    
    res.status(201).json({ 
      message: "User created successfully",
      user: userResponse
    });
  } catch (err) {
    console.error("Create user error:", err);
    if (err.code === 11000) {
      return res.status(409).json({ error: "Email already exists" });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: "Validation failed", details: err.message });
    }
    res.status(500).json({ error: "Failed to create user", message: err.message });
  }
};

// GET all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.status(200).json(users);
  } catch (err) {
    console.error("Get all users error:", err);
    res.status(500).json({ error: "Failed to retrieve users", message: err.message });
  }
};

// GET single user by ID
const getSingleUser = async (req, res) => {
  const userId = req.params.id;
  
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid user ID format" });
  }
  
  try {
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.status(200).json(user);
  } catch (err) {
    console.error("Get single user error:", err);
    res.status(500).json({ error: "Failed to retrieve user", message: err.message });
  }
};

// UPDATE user
const updateUser = async (req, res) => {
  const userId = req.params.id;
  
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid user ID format" });
  }
  
  try {
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const updateData = {};
    const allowedUpdates = ['firstName', 'lastName', 'favoriteColor', 'phone', 'address', 'company', 'jobTitle', 'website', 'notes'];
    
    // Only admin can update role and isActive
    if (req.user?.role === 'admin') {
      allowedUpdates.push('role', 'isActive');
    }
    
    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }
    
    if (req.body.birthday) updateData.birthday = new Date(req.body.birthday);
    if (req.body.password) {
      updateData.password = await bcrypt.hash(req.body.password, 10);
    }
    updateData.updatedAt = new Date();
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No valid fields provided for update" });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');
    
    res.status(200).json(updatedUser);
  } catch (err) {
    console.error("Update user error:", err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: "Validation failed", details: err.message });
    }
    res.status(500).json({ error: "Update failed", message: err.message });
  }
};

// DELETE user (soft delete)
const deleteUser = async (req, res) => {
  const userId = req.params.id;
  
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid user ID format" });
  }
  
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Soft delete - set isActive to false
    await User.findByIdAndUpdate(userId, { 
      $set: { isActive: false, updatedAt: new Date() } 
    });
    
    res.status(200).json({ 
      message: "User deactivated successfully",
      deletedCount: 1
    });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: "Delete failed", message: err.message });
  }
};

// Get current user profile (from JWT)
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
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
    const user = await User.findOne({ email }).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.status(200).json(user);
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