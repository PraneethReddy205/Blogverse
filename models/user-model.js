const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Blog=require('../models/blog');

const userSchema = new Schema({
    username: String,
    googleId: String,
    thumbnail: String,
    mail: String,
    readLater: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Blog' }],
    isAdmin: {
        type: Boolean,
        default: false
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;   