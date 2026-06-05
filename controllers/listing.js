const fetch = require("node-fetch");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");
const ExpressError = require("../utils/ExpressError.js");

// GET /listings
module.exports.index = async (req, res) => {
    let { search, maxPrice, gender, roomType, amenities } = req.query;
    if (amenities && !Array.isArray(amenities)) amenities = [amenities];
    let query = {};
    if (search && search.trim() !== "") {
        query.$or = [
            { location: { $regex: search, $options: "i" } },
            { title: { $regex: search, $options: "i" } },
        ];
    }
    if (maxPrice && Number(maxPrice) < 50000) {
        query.price = { $lte: Number(maxPrice) };
    }
    if (gender && gender !== "") query.gender = gender;
    if (roomType && roomType !== "") query.roomType = roomType;
    if (amenities && amenities.length > 0) query.amenities = { $all: amenities };

    let allListings = await Listing.find(query);

    let savedIds = [];
    if (req.user) {
        const user = await User.findById(req.user._id).populate("savedListings");
        savedIds = user.savedListings.map(l => l._id.toString());
    }

    res.render("listings/index.ejs", {
        allListings, search, maxPrice, gender, roomType,
        amenities: amenities || [], savedIds,
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
    if (req.files && req.files.length > 0) {
        newListing.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    } else {
        newListing.images = [{ url: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=60", filename: "default" }];
    }
    try {
        const location = req.body.listing.location;
        const geoResponse = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}, India&format=json&limit=1`,
            { headers: { "User-Agent": "PGFinder/1.0 (pgfinder@gmail.com)" } }
        );
        const geoData = await geoResponse.json();
        if (geoData.length > 0) {
            newListing.geometry = { type: "Point", coordinates: [parseFloat(geoData[0].lon), parseFloat(geoData[0].lat)] };
        }
    } catch (err) { console.log("Geocoding failed:", err); }
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
    if (!listing) throw new ExpressError(404, "Listing not found!");
    res.render("listings/show.ejs", { listing });
};

// GET /listings/:id/edit
module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    if (!listing) throw new ExpressError(404, "Listing not found!");
    res.render("listings/edit.ejs", { listing });
};

// PUT /listings/:id
module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing }, { new: true });
    if (req.files && req.files.length > 0) {
        let newImages = req.files.map(f => ({ url: f.path, filename: f.filename }));
        listing.images.push(...newImages);
        await listing.save();
    }
    try {
        const location = req.body.listing.location;
        const geoResponse = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}, India&format=json&limit=1`,
            { headers: { "User-Agent": "PGFinder/1.0 (pgfinder@gmail.com)" } }
        );
        const geoData = await geoResponse.json();
        if (geoData.length > 0) {
            listing.geometry = { type: "Point", coordinates: [parseFloat(geoData[0].lon), parseFloat(geoData[0].lat)] };
            await listing.save();
        }
    } catch (err) { console.log("Geocoding failed:", err.message); }
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

// POST /listings/:id/like — toggle like
module.exports.toggleLike = async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(req.user._id);
    const alreadyLiked = user.savedListings.map(i => i.toString()).includes(id);
    if (alreadyLiked) {
        user.savedListings.pull(id);
    } else {
        user.savedListings.push(id);
    }
    await user.save();
    res.json({ liked: !alreadyLiked });
};

// GET /listings/saved — saved listings page
module.exports.savedListings = async (req, res) => {
    const user = await User.findById(req.user._id).populate("savedListings");
    res.render("listings/saved.ejs", { savedListings: user.savedListings });
};