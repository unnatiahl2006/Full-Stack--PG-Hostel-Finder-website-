const fetch = require("node-fetch");
const Listing = require("../models/listing.js");
const ExpressError = require("../utils/ExpressError.js");

// GET /listings
module.exports.index = async (req, res) => {
    let { search, maxPrice, gender, roomType, amenities } = req.query;

    // amenities array banao — ek hogi toh bhi array mein
    if (amenities && !Array.isArray(amenities)) amenities = [amenities];

    let query = {};

    // search filter
    if (search && search.trim() !== "") {
        query.$or = [
            { location: { $regex: search, $options: "i" } },
            { title: { $regex: search, $options: "i" } },
        ];
    }

    // price filter
    if (maxPrice && Number(maxPrice) < 50000) {
        query.price = { $lte: Number(maxPrice) };
    }

    // gender filter
    if (gender && gender !== "") {
        query.gender = gender;
    }

    // roomType filter
    if (roomType && roomType !== "") {
        query.roomType = roomType;
    }

    // amenities filter — saari selected amenities honi chahiye
    if (amenities && amenities.length > 0) {
        query.amenities = { $all: amenities };
    }

    let allListings = await Listing.find(query);


    res.render("listings/index.ejs", {
        allListings, search, maxPrice, gender, roomType,
        amenities: amenities || []
    });
};

// GET /listings/new
module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

// POST /listings
module.exports.createListing = async (req, res) => {
    let newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;

    // multiple images upload
    if (req.files && req.files.length > 0) {
        newListing.images = req.files.map(f => ({
            url: f.path,
            filename: f.filename,
        }));
    } else {
        // default image agar koi upload nahi ki
        newListing.images = [{
            url: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=60",
            filename: "default"
        }];
    }

    // Nominatim se coordinates fetch karo
    try {
        const location = req.body.listing.location;
        const geoResponse = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}, India&format=json&limit=1`,
            { headers: { "User-Agent": "PGFinder/1.0 (pgfinder@gmail.com)" } }
        );
        const geoData = await geoResponse.json();

        if (geoData.length > 0) {
            newListing.geometry = {
                type: "Point",
                coordinates: [
                    parseFloat(geoData[0].lon),  // longitude pehle
                    parseFloat(geoData[0].lat),  // latitude baad mein
                ]
            };
        }
    } catch (err) {
        console.log("Geocoding failed FULL ERROR:", err);
        // geocoding fail ho toh bhi listing save ho
    }

    await newListing.save();
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
};

// GET /listings/:id
module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findById(id)
        .populate({ path: "reviews", populate: { path: "author" } })
        .populate("owner");
    if (!listing) {
        throw new ExpressError(404, "Listing not found!");
    }
    res.render("listings/show.ejs", { listing });
};

// GET /listings/:id/edit
module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    if (!listing) {
        throw new ExpressError(404, "Listing not found!");
    }
    res.render("listings/edit.ejs", { listing });
};

// PUT /listings/:id
module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing }, { new: true });

    // images update — nayi images add karo purani ke saath
    if (req.files && req.files.length > 0) {
        let newImages = req.files.map(f => ({
            url: f.path,
            filename: f.filename,
        }));
        listing.images.push(...newImages);
        await listing.save();
    }

    // location update hoti hai toh coordinates bhi update karo
    try {
        const location = req.body.listing.location;
        const geoResponse = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}, India&format=json&limit=1`,
            { headers: { "User-Agent": "PGFinder/1.0 (pgfinder@gmail.com)" } }
        );
        const geoData = await geoResponse.json();
        if (geoData.length > 0) {
            listing.geometry = {
                type: "Point",
                coordinates: [
                    parseFloat(geoData[0].lon),
                    parseFloat(geoData[0].lat),
                ]
            };
            await listing.save();
        }
    } catch (err) {
        console.log("Geocoding failed:", err.message);
    }

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
};

// DELETE /listings/:id
module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};
