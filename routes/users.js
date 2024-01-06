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
 
  if (
    !checkBody(req.body, [
      "firstname",
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
          error: "This username already exists",
        });
      }else {
        const hash = bcrypt.hashSync(req.body.password, 10);
        const newUser = new User({
          firstname: req.body.firstname,
          username: usernameLowerCase,
          password: hash,
          token: uid2(32),
          tasks: [],
        });
        newUser.save().then(() => {
          User.findOne({username:usernameLowerCase})
          .then(data => {res.json({result: true, user:data})})
        })
      }
    });
});

//SIGN IN
router.post('/signin', (req, res) => {
  const usernameLowerCase = req.body.username.toLowerCase();
  if (!checkBody(req.body, ['username', 'password'])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }

  User.findOne({ username: usernameLowerCase }).then(data => {
    if (data && bcrypt.compareSync(req.body.password, data.password)) {
      res.json({ result: true, username: data.username , firstname : data.firstname});
    } else {
      res.json({ result: false, error: 'User not found or wrong password' });
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

//GET NORMAL TASKS
router.get('/tasks/:username', (req,res) => {
  User.findOne({username:req.params.username})
  .then(data => {
    const tasks = data.tasks.filter((task) => task.isUrgent === false)
    res.json({tasks})
  })
})

//GET URGENT TASKS
router.get('/urgent/:username', (req,res) => {
  User.findOne({username:req.params.username})
  .then(data => {
    const tasks = data.tasks.filter((task) => task.isUrgent === true)
    res.json({tasks})
  })
})

module.exports = router;
