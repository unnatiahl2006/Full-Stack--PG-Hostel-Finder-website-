const mongoose = require("mongoose");
const passportLocalMongoose = require('passport-local-mongoose').default || require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
});

// username aur password automatically add ho jaate hain
// passportLocalMongoose ki wajah se
userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);
module.exports = User;