const express = require('express');
const mongoose = require('mongoose');
const moment = require('moment');

const router = express.Router();
const User = mongoose.model('User');
const Exercise = mongoose.model('Exercise');

router.post('/', (req, res, next) => {
  const { username } = req.body;
  User.findOne({ username })
    .then((user) => {
      if (user) throw new Error('username already taken');
      return User.create({ username });
    })
    .then((user) =>
      res.status(200).send({
        username: user.username,
        _id: user._id,
      })
    )
    .catch((err) => {
      console.log(err);
      res.status(500).send(err.message);
    });
});
router.post('/:_id/exercises', (req, res, next) => {
  let  userId  = req.params._id;
  let { description, duration, date } = req.body;
  User.findOne({ _id: userId })
    .then((user) => {
      if (!user) throw new Error('Unknown user with _id');
      date = date || Date.now();
      return Exercise.create({
        description,
        duration,
        date,
        userId,
      }).then((ex) =>
        res.status(200).send({
          _id: user._id,
          username: user.username,
          date: moment(ex.date).format('ddd MMM DD YYYY'),
          duration,
          description
        })
      );
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send(err.message);
    });
});

// return all users
router.get('/', (req, res) => {
  User.find({}, (err, users) => {
    if (err) return console.error(err);
    res.json(users);
  });
});

router.get('/:_id/logs', (req, res, next) => {
  let userId = req.params._id;
  let { from, to, limit } = req.query;
  from = moment(from, 'YYYY-MM-DD').isValid() ? moment(from, 'YYYY-MM-DD') : 0;
  to = moment(to, 'YYYY-MM-DD').isValid()
    ? moment(to, 'YYYY-MM-DD')
    : moment().add(1000000000000);
  User.findById(userId)
    .then((user) => {
      if (!user) throw new Error('Unknown user with _id');
      Exercise.find({ userId })
        .where('date')
        .gte(from)
        .lte(to)
        .limit(+limit)
        .exec()
        .then((log) =>
          res.status(200).send({
            _id: userId,
            username: user.username,
            count: log.length,
            log: log.map((o) => ({
              description: o.description,
              duration: o.duration,
              date: moment(o).format('ddd MMM DD YYYY'),
            })),
          })
        );
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send(err.message);
    });
});

module.exports = router;
