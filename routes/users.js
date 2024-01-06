var express = require('express');
var router = express.Router();
require("../models/connection");
const User = require('../models/users')

const { checkBody } = require("../modules/checkBody");
const uid2 = require("uid2");
const bcrypt = require("bcrypt");

//CREATE NEW USER
router.post("/signup", (req, res) => {
  const usernameLowerCase = req.body.username.toLowerCase();
  console.log(usernameLowerCase)
  if (
    !checkBody(req.body, [
      "username",
      "password",
    ])
  ) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

// Check if the user has not already been registered
  User.findOne({ username: usernameLowerCase })
    .then((existingUser) => {
      if (existingUser) {
        return res.json({
          result: false,
          error: "This username is already used",
        });
      }else {
        const hash = bcrypt.hashSync(req.body.password, 10);
        const newUser = new User({
          username: usernameLowerCase,
          password: hash,
          token: uid2(32),
          tasks: [],
        });
        newUser.save().then(() => {
          User.findOne({username:usernameLowerCase})
          .then(data => {res.json({user:data})})
        })
      }
    });
});

//CREATE NEW TASK FOR A USER
router.put('/newtask', (req, res) => {
  User.updateOne(
    { username: req.body.username },
    {
      $push: {
        tasks: {
          task: req.body.task,
          isUrgent: req.body.isUrgent
        }
      }
    }
  ).then(() => {
    User.findOne({ username: req.body.username })
      .then(data => {
        res.json({ user: data });
      })
      .catch(err => {
        res.status(500).json({ error: err.message });
      });
  });
});

// DELETE TASK BY ID
router.delete('/deletetask/:id', (req, res) => {
  const taskId = req.params.id;
  const username = req.body.username;

  User.updateOne(
    { username: username },
    { $pull: { tasks: { _id: taskId } } }
  ).then(() => {
    User.findOne({ username: username })
      .then(data => {
        res.json({ user: data });
      })
      .catch(err => {
        res.status(500).json({ error: err.message });
      });
  });
});

module.exports = router;
