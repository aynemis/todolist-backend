const mongoose = require('mongoose');

const usersSchema = mongoose.Schema({
    firstname: String,
    username: String,
    password: String,
    tasks: [{task: String,
            isUrgent: Boolean}],
});

const User = mongoose.model('users', usersSchema);

module.exports = User;