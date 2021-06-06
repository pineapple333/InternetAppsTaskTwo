const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    sname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    pwd: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: Date.now
    },
})

const User = mongoose.model('User', UserSchema);

module.exports = User;