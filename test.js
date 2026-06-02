require("dotenv").config();
const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);
const mongoose = require("mongoose");
const Listing = require("./models/listing");

async function test() {
    await mongoose.connect(process.env.ATLASDB_URL);

    console.log("Connected");

    const count = await Listing.countDocuments();

    console.log("Listings:", count);

    process.exit();
}

test();