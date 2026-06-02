const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// cloudinary configure karo .env se
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// cloudinary storage setup
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "pgfinder",          // cloudinary mein folder naam
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
    },
});

module.exports = {
    upload: multer({ storage }),    // multer with cloudinary storage
    cloudinary,                     // baad mein delete ke liye
};