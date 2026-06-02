require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js")
const session= require("express-session");
const {MongoStore} = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const passportLocalMongoose = require('passport-local-mongoose');
const User = require("./models/user.js");
const dns=require("dns");
dns.setServers(["1.1.1.1","8.8.8.8"]);

// const MONGO_URL = "mongodb://127.0.0.1:27017/pgfinder";
const dbUrl= process.env.ATLASDB_URL;

main()
  .then(() => console.log("mongodb connected"))
  .catch(err => {
      console.error("FULL ERROR:");
      console.error(err);
  });
async function main() {
    await mongoose.connect(dbUrl, {
    serverSelectionTimeoutMS: 10000
});
}

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride('_method'));

const store = new MongoStore({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600,
});

store.on("error", (err) => {
    console.log("Mongo Session Store Error:", err);
});


const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
};

app.use(session(sessionOptions));

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Flash messages + currentUser middleware - ROUTES SE PEHLE
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currentUser = req.user;
    res.locals.search = req.query.search || "";
    res.locals.maxPrice = req.query.maxPrice || "";
    res.locals.gender = req.query.gender || "";
    res.locals.roomType = req.query.roomType || "";
    let am = req.query.amenities;
    res.locals.amenities = am ? (Array.isArray(am) ? am : [am]) : []; // logged in user (ya undefined)
    next();
});

app.get("/", (req, res) => {
    res.redirect("/listings");
});
app.use((req, res, next) => {
    console.log(req.method, req.path);
    next();
});

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

app.all(/(.*)/, (req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
});

app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong" } = err;
    res.status(statusCode).render("error.ejs", { err });
});

app.listen(8080, () => {
    console.log("app is listening to port 8080");
});