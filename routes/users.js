const router = require("express").Router();
const usersController = require("../controllers/users");
const { verifyToken, requireAdmin } = require("../middleware/auth");

// Public routes (no authentication required)
router.post("/google-auth", usersController.googleAuth);

// Protected routes (require authentication)
router.get("/profile", verifyToken, usersController.getMyProfile);

// Admin only routes (without validation for now)
router.get("/", verifyToken, requireAdmin, usersController.getAllUsers);
router.get("/:id", verifyToken, requireAdmin, usersController.getSingleUser);
router.put("/:id", verifyToken, requireAdmin, usersController.updateUser);
router.delete("/:id", verifyToken, requireAdmin, usersController.deleteUser);

module.exports = router;