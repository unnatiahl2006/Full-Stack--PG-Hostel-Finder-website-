const mongoose = require("mongoose");
const passportLocalMongoose = require('passport-local-mongoose').default || require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    savedListings: [       
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Listing",
        }
    ],
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);
module.exports = User;