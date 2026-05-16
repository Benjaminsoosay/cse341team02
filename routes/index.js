const router = require("express").Router();
const contactsController = require("../controllers/contacts");
const validate = require("../middleware/validate");

// Home test route
router.get("/", (req, res) => {
  res.send("Contacts route working");
});

// GET all contacts
router.get("/all", contactsController.getAll);

// GET single contact
router.get("/:id", contactsController.getSingle);

// CREATE contact
router.post(
  "/",
  validate.saveContact,
  contactsController.createContact
);

// UPDATE contact
router.put(
  "/:id",
  validate.saveContact,
  contactsController.updateContact
);

// DELETE contact
router.delete("/:id", contactsController.deleteContact);

module.exports = router;