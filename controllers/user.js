const User = require("../models/user.js");
const passport = require("passport");

// GET /signup
module.exports.renderSignupForm = (req, res) => {
    res.render("user/signup");
};

// POST /signup
module.exports.signup = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const user = new User({ username, email });
        await User.register(user, password);
        passport.authenticate("local")(req, res, () => {
            req.flash("success", "Welcome to the app!");
            res.redirect(req.session.redirectUrl || "/listings");
            delete req.session.redirectUrl;
        });
    } catch (err) {
        req.flash("error", err.message);
        res.redirect("/signup");
    }
};

// GET /login
module.exports.renderLoginForm = (req, res) => {
    res.render("user/login");
};

// POST /login
module.exports.login = (req, res) => {
    req.flash("success", "Welcome back!");
    let redirectUrl = res.locals.redirectUrl || "/listings";
    delete req.session.redirectUrl;
    res.redirect(redirectUrl);
};

// GET /logout
module.exports.logout = (req, res, next) => {
    req.logout(err => {
        if (err) return next(err);
        req.flash("success", "Logged out successfully!");
        res.redirect("/login");
    });
};