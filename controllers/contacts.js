const mongodb = require("../db/connect");
const { ObjectId } = require("mongodb");

/* =========================
   GET ALL CONTACTS
========================= */
const getAll = async (req, res) => {
  let limit = parseInt(req.query.limit);

  if (isNaN(limit) || limit <= 0) {
    limit = 0; // no limit
  }

  try {
    const result = await mongodb
                          .getDb()
                          .collection("contacts")  // REMOVED extra .db()
                          .find()
                          .limit(limit)
                          .toArray();
                          
    return res.status(200).json(result);

  } catch (error) {
    return res.status(500).json({
      error: "Failed to retrieve contacts",
      message: error.message
    })
  }
};

/* =========================
   GET SINGLE CONTACT
========================= */
const getSingle = async(req, res) => {
  const contactId = req.params.id;

  // VALIDATION (ID CHECK)
  if (!ObjectId.isValid(contactId)) {
    return res.status(400).json({
      error: "Invalid contact ID format"
    });
  }

  try {
    const result = await mongodb
                  .getDb()
                  .collection("contacts")  // REMOVED extra .db()
                  .findOne({ _id: new ObjectId(contactId)});

    if (!result) {
      return res.status(404).json({
          error: "Contact not found"
      });
    }

    return res.status(200).json(result);

  } catch (error) {
    return res.status(500).json({
        error: "Failed to retrieve contact",
        message: error.message
    });
  }
}

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
      .collection("contacts")  // REMOVED extra .db()
      .insertOne(contact);

    if (response.acknowledged) {
      return res.status(201).json({
        message: "Contact created successfully",
        id: response.insertedId
      });
    } else {
      return res.status(500).json({
        error: "Failed to create contact"
      });
    }
  } catch (err) {
    return res.status(500).json({
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

  const { firstName, lastName, email, favoriteColor, birthday } = req.body;

  const contact = {}
  if(firstName) contact.firstName = firstName
  if(lastName) contact.lastName = lastName
  if(email) contact.email = email
  if(favoriteColor) contact.favoriteColor= favoriteColor
  if(birthday) contact.birthday= birthday

  try {
    const response = await mongodb
      .getDb()
      .collection("contacts")  // REMOVED extra .db()
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
      return res.status(200).json({
        message: "Contact updated successfully"
      });
    } else {
      return res.status(200).json({
        message: "No changes detected"
      });
    }
  } catch (err) {
    return res.status(500).json({
      error: "Update failed",
      message: err.message
    });
  }
}

/* =========================
   DELETE CONTACT
========================= */
const deleteContact = async (req, res) => {
  const contactId = req.params.id;

  // VALIDATION
  if (!ObjectId.isValid(contactId)) {
    return res.status(400).json({
      error: "Invalid contact ID format"
    });
  }
  
  try {
    const response = await mongodb
                      .getDb()
                      .collection("contacts")  // REMOVED extra .db()
                      .deleteOne({ _id: new ObjectId(contactId) })
                      
    if (response.deletedCount > 0) {
      return res.status(200).json({
        message: "Contact deleted successfully"
      });
    } else {
      return res.status(404).json({
          error: "Contact not found"
      });
    }
  } catch (err) {
    return res.status(500).json({
      error: "Delete failed",
      message: err.message
    });
  }
}

// EXPORTS
module.exports = {
  getAll,
  getSingle,
  createContact,
  updateContact,
  deleteContact
};