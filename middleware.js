const Listing = require("./models/listing.js");
const Review = require("./models/review.js");
const ExpressError = require("./utils/ExpressError.js");

// Authentication check
module.exports.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    // sirf GET requests ka redirectUrl save karo
    if (req.method === "GET") {
        req.session.redirectUrl = req.originalUrl;
    }
    req.flash("error", "Please login first!");
    res.redirect("/login");
};

// Redirect URL ko locals mein save karo
module.exports.saveRedirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};

// Listing ka owner hai ya nahi check karo
module.exports.isOwner = async (req, res, next) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    if (!listing.owner.equals(req.user._id)) {
        req.flash("error", "You don't have permission to do that!");
        return res.redirect(`/listings/${id}`);
    }
    next();
};

// Review ka author hai ya nahi check karo
module.exports.isReviewAuthor = async (req, res, next) => {
    let { id, reviewId } = req.params;
    let review = await Review.findById(reviewId);
    
    // agar author hi nahi hai ya current user nahi hai
    if (!review.author || !review.author.equals(req.user._id)) {
        req.flash("error", "You didn't write this review!");
        return res.redirect(`/listings/${id}`);
    }
    next();
};