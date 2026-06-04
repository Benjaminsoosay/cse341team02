const router = require("express").Router();
const usersController = require("../controllers/users");
const { verifyToken, requireAdmin } = require("../middleware/auth");

// Public routes (no authentication required)
router.post("/google-auth", usersController.googleAuth);

// Protected routes (require authentication)
router.get("/profile", verifyToken, usersController.getMyProfile);

// REMOVED AUTHENTICATION - ALL PUBLIC NOW
router.get("/", usersController.getAllUsers);
router.get("/:id", usersController.getSingleUser);
router.put("/:id", usersController.updateUser);
router.delete("/:id", usersController.deleteUser);

module.exports = router;