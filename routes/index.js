const router = require("express").Router();
const contactsController = require("../controllers/contacts");

const validate = require("../middleware/validate");

// GET all contacts
router.get("/", contactsController.getAll);

// GET single contact (ID validation inside controller)
router.get("/:id", contactsController.getSingle);

// CREATE contact (VALIDATION REQUIRED)
router.post(
  "/",
  validate.saveContact,
  contactsController.createContact
);

// UPDATE contact (VALIDATION REQUIRED)
router.put(
  "/:id",
  validate.saveContact,
  contactsController.updateContact
);

// DELETE contact (ID validation inside controller)
router.delete("/:id", contactsController.deleteContact);

module.exports = router;