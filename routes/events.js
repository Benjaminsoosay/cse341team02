const express = require("express");
const router = express.Router();
const eventsController = require("../controllers/events");
const { verifyToken } = require("../middleware/auth");
const { validateEvent, validateObjectId } = require("../middleware/validation");

// GET routes (public)
router.get("/", eventsController.getAllEvents);
router.get("/:id", validateObjectId, eventsController.getSingleEvent);

// POST, PUT, DELETE require authentication
router.post("/", verifyToken, validateEvent, eventsController.createEvent);
router.put("/:id", verifyToken, validateObjectId, validateEvent, eventsController.updateEvent);
router.delete("/:id", verifyToken, validateObjectId, eventsController.deleteEvent);

module.exports = router;