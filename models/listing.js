const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: String,
    images: [
        {
            url: { type: String },
            filename: { type: String },
        }
    ],
    price: Number,
    location: String,
    state: String,
    gender: {
        type: String,
        enum: ["boys", "girls", "coed"],
        default: "coed",
    },
    roomType: {
        type: String,
        enum: ["single", "double", "triple"],
        default: "double",
    },
    amenities: {
        type: [String],  // ["wifi", "meals", "ac", "parking", "laundry", "tv"]
        default: [],
    },
    geometry: {
        type: {
            type: String,
            enum: ["Point"],   // sirf Point type allowed hai
        },
        coordinates: {
            type: [Number],    // [longitude, latitude]
        }
    },
    reviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Review",
        },
    ],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
});

listingSchema.post("findOneAndDelete", async (listing) => {
    if (listing) {
        await Review.deleteMany({ _id: { $in: listing.reviews } });
    }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;