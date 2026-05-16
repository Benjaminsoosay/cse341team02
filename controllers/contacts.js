const mongodb = require("../db/connect");
const { ObjectId } = require("mongodb");

/* =========================
   GET ALL CONTACTS
========================= */
const getAll = (req, res) => {
  let limit = parseInt(req.query.limit);

  if (isNaN(limit) || limit <= 0) {
    limit = 0; // no limit
  }

  mongodb
    .getDb()
    .db()
    .collection("contacts")
    .find()
    .limit(limit)
    .toArray()
    .then((lists) => {
      res.status(200).json(lists);
    })
    .catch((err) => {
      res.status(500).json({
        error: "Failed to retrieve contacts",
        message: err.message
      });
    });
};

/* =========================
   GET SINGLE CONTACT
========================= */
const getSingle = (req, res) => {
  const contactId = req.params.id;

  // VALIDATION (ID CHECK)
  if (!ObjectId.isValid(contactId)) {
    return res.status(400).json({
      error: "Invalid contact ID format"
    });
  }

  mongodb
    .getDb()
    .db()
    .collection("contacts")
    .findOne({ _id: new ObjectId(contactId) })
    .then((result) => {
      if (!result) {
        return res.status(404).json({
          error: "Contact not found"
        });
      }

      res.status(200).json(result);
    })
    .catch((err) => {
      res.status(500).json({
        error: "Failed to retrieve contact",
        message: err.message
      });
    });
};

/* =========================
   CREATE CONTACT
========================= */
const createContact = async (req, res) => {
  try {
    const contact = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      favoriteColor: req.body.favoriteColor,
      birthday: req.body.birthday
    };

    const response = await mongodb
      .getDb()
      .db()
      .collection("contacts")
      .insertOne(contact);

    if (response.acknowledged) {
      res.status(201).json({
        message: "Contact created successfully",
        id: response.insertedId
      });
    } else {
      res.status(500).json({
        error: "Failed to create contact"
      });
    }
  } catch (err) {
    res.status(500).json({
      error: "Server error",
      message: err.message
    });
  }
};

/* =========================
   UPDATE CONTACT
========================= */
const updateContact = async (req, res) => {
  const contactId = req.params.id;

  // VALIDATION
  if (!ObjectId.isValid(contactId)) {
    return res.status(400).json({
      error: "Invalid contact ID format"
    });
  }

  const contact = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    favoriteColor: req.body.favoriteColor,
    birthday: req.body.birthday
  };

  try {
    const response = await mongodb
      .getDb()
      .db()
      .collection("contacts")
      .updateOne(
        { _id: new ObjectId(contactId) },
        { $set: contact }
      );

    if (response.matchedCount === 0) {
      return res.status(404).json({
        error: "Contact not found"
      });
    }

    if (response.modifiedCount > 0) {
      res.status(200).json({
        message: "Contact updated successfully"
      });
    } else {
      res.status(200).json({
        message: "No changes detected"
      });
    }
  } catch (err) {
    res.status(500).json({
      error: "Update failed",
      message: err.message
    });
  }
};

/* =========================
   DELETE CONTACT
========================= */
const deleteContact = (req, res) => {
  const contactId = req.params.id;

  // VALIDATION
  if (!ObjectId.isValid(contactId)) {
    return res.status(400).json({
      error: "Invalid contact ID format"
    });
  }

  mongodb
    .getDb()
    .db()
    .collection("contacts")
    .deleteOne({ _id: new ObjectId(contactId) })
    .then((response) => {
      if (response.deletedCount > 0) {
        res.status(200).json({
          message: "Contact deleted successfully"
        });
      } else {
        res.status(404).json({
          error: "Contact not found"
        });
      }
    })
    .catch((err) => {
      res.status(500).json({
        error: "Delete failed",
        message: err.message
      });
    });
};

/* =========================
   EXPORTS
========================= */
module.exports = {
  getAll,
  getSingle,
  createContact,
  updateContact,
  deleteContact
};