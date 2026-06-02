//here i have written the logic of initialising database
require("dotenv").config();
const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);
const fetch = require("node-fetch");
const mongoose = require("mongoose");
const data = require("./data.js");
const Listing = require("../models/listing.js");

const dbUrl = process.env.ATLASDB_URL;

async function main() {
    await mongoose.connect(dbUrl);
}

main()
.then(async () => {
    console.log("mongodb connected");
    await initdb();
}).catch((err) => {
    console.log(err);
});

const initdb = async () => {
    console.log("initdb started");
    console.log("before delete");
    await Listing.deleteMany({});
    console.log("after delete");

    console.log("before loop");

    let allData = [];

    for (let obj of data.data) {
        let coordinates = [0, 0];

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(obj.location)}, India&format=json&limit=1`,
                {
                    headers: {
                        "User-Agent": "PGFinder/1.0 (pgfinder@gmail.com)"
                    }
                }
            );

            const geoData = await response.json();

            if (geoData.length > 0) {
                coordinates = [
                    parseFloat(geoData[0].lon),
                    parseFloat(geoData[0].lat)
                ];
            }

            await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (err) {
            console.log(`✗ ${obj.location} failed:`, err.message);
        }

        allData.push({
            ...obj,
            owner: "6a1ab71a95357c0e6f2cda15",
            geometry: {
                type: "Point",
                coordinates
            }
        });
    }

    console.log("after loop");

    await Listing.insertMany(allData);
    console.log("after insert");

    const count = await Listing.countDocuments();
    console.log("documents:", count);

    mongoose.connection.close();
};