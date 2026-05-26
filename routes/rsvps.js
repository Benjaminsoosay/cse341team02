const express = require("express");
const router = express.Router();
const rsvpsController = require("../controllers/rsvps");
const { verifyToken } = require("../middleware/auth");
const { validateRSVP, validateObjectId } = require("../middleware/validation");

// GET routes (public with filters)
router.get("/", rsvpsController.getAllRSVPs);
router.get("/:id", validateObjectId, rsvpsController.getSingleRSVP);

// POST, PUT, DELETE require authentication
router.post("/", verifyToken, validateRSVP, rsvpsController.createRSVP);
router.put("/:id", verifyToken, validateObjectId, rsvpsController.updateRSVP);
router.delete("/:id", verifyToken, validateObjectId, rsvpsController.deleteRSVP);

module.exports = router;
