const mongodb = require("../db/connect");
const { ObjectId } = require("mongodb");

// GET ALL CONTACTS (UPDATED WITH LIMIT)
const getAll = (req, res) => {
  let limit = parseInt(req.query.limit);

  if (isNaN(limit) || limit <= 0) {
    limit = 0;
  }

  mongodb
    .getDb()
    .db()
    .collection("contacts")
    .find()
    .limit(limit)
    .toArray()
    .then((lists) => {
      res.setHeader("Content-Type", "application/json");
      res.status(200).json(lists);
    })
    .catch((err) => {
      res.status(500).json({ error: err.message });
    });
};

// GET SINGLE CONTACT
const getSingle = (req, res) => {
  const contactId = req.params.id;

  if (!ObjectId.isValid(contactId)) {
    return res.status(400).json({
      error: "Must use a valid contact id to find a contact"
    });
  }

  mongodb
    .getDb()
    .db()
    .collection("contacts")
    .find({ _id: new ObjectId(contactId) })
    .toArray()
    .then((result) => {
      res.status(200).json(result[0]);
    })
    .catch((err) => {
      res.status(500).json({ error: err.message });
    });
};

// CREATE CONTACT
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
      res.status(201).json(response);
    } else {
      res.status(500).json({
        error: "Error creating contact"
      });
    }
  } catch (err) {
    res.status(500).json({
      error: err.message || "Error creating contact"
    });
  }
};

// UPDATE CONTACT
const updateContact = async (req, res) => {
  const contactId = req.params.id;

  if (!ObjectId.isValid(contactId)) {
    return res.status(400).json({
      error: "Must use a valid contact id to update a contact"
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
        message: "No changes were made"
      });
    }
  } catch (err) {
    res.status(500).json({
      error: err.message || "Update failed"
    });
  }
};

// DELETE CONTACT
const deleteContact = (req, res) => {
  const contactId = req.params.id;

  if (!ObjectId.isValid(contactId)) {
    return res.status(400).json({
      error: "Must use a valid contact id to delete a contact"
    });
  }

  mongodb
    .getDb()
    .db()
    .collection("contacts")
    .deleteOne({ _id: new ObjectId(contactId) })
    .then((response) => {
      if (response.deletedCount > 0) {
        res.status(200).json({ message: "Contact deleted" });
      } else {
        res.status(404).json({ message: "Contact not found" });
      }
    })
    .catch((err) => {
      res.status(500).json({
        error: err.message || "Delete failed"
      });
    });
};

// EXPORTS
module.exports = {
  getAll,
  getSingle,
  createContact,
  updateContact,
  deleteContact
};