const db = require('../models');
const Temple = db.temples;

const apiKey = 'Ezl0961tEpx2UxTZ5v2uKFK91qdNAr5npRlMT1zLcE3Mg68Xwaj3N8Dyp1R8IvFenrVwHRllOUxF0Og00l0m9NcaYMtH6Bpgdv7N';

exports.create = (req, res) => {
  if (!req.body.name) {
    res.status(400).send({ message: 'Content can not be empty!' });
    return;
  }
  const temple = new Temple({
    temple_id: req.body.temple_id,
    name: req.body.name,
    description: req.body.description,
    location: req.body.location,
  });
  temple
    .save(temple)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || 'Some error occurred while creating the Temple.',
      });
    });
};

exports.findAll = (req, res) => {
  if (req.header('apiKey') === apiKey) {
    Temple.find(
      {},
      {
        temple_id: 1,
        name: 1,
        location: 1,
        dedicated: 1,
        additionalInfo: 1,
        _id: 0,
      }
    )
      .then((data) => {
        res.send(data);
      })
      .catch((err) => {
        res.status(500).send({
          message: err.message || 'Some error occurred while retrieving temples.',
        });
      });
  } else {
    res.send('Invalid apiKey, please read the documentation.');
  }
};

exports.findOne = (req, res) => {
  const temple_id = req.params.temple_id;
  if (req.header('apiKey') === apiKey) {
    Temple.find({ temple_id: temple_id })
      .then((data) => {
        if (!data || data.length === 0)
          res.status(404).send({ message: 'Not found Temple with id ' + temple_id });
        else res.send(data[0]);
      })
      .catch((err) => {
        res.status(500).send({
          message: 'Error retrieving Temple with temple_id=' + temple_id,
        });
      });
  } else {
    res.send('Invalid apiKey, please read the documentation.');
  }
};

// Update a Temple by temple_id
exports.update = (req, res) => {
  if (!req.body) {
    return res.status(400).send({
      message: 'Data to update can not be empty!',
    });
  }

  const temple_id = req.params.temple_id;

  if (req.header('apiKey') !== apiKey) {
    return res.send('Invalid apiKey, please read the documentation.');
  }

  Temple.findOneAndUpdate(
    { temple_id: temple_id },
    req.body,
    { new: true }
  )
    .then((data) => {
      if (!data) {
        res.status(404).send({
          message: `Cannot update Temple with temple_id=${temple_id}. Maybe Temple was not found!`,
        });
      } else {
        res.send(data);
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: 'Error updating Temple with temple_id=' + temple_id,
      });
    });
};

// Delete a Temple by temple_id
exports.delete = (req, res) => {
  const temple_id = req.params.temple_id;

  if (req.header('apiKey') !== apiKey) {
    return res.send('Invalid apiKey, please read the documentation.');
  }

  Temple.findOneAndDelete({ temple_id: temple_id })
    .then((data) => {
      if (!data) {
        res.status(404).send({
          message: `Cannot delete Temple with temple_id=${temple_id}. Maybe Temple was not found!`,
        });
      } else {
        res.send({
          message: 'Temple was deleted successfully!',
          deletedTemple: data,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: 'Could not delete Temple with temple_id=' + temple_id,
      });
    });
};