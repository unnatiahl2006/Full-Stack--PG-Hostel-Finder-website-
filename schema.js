const Joi = require("joi");

module.exports.listingSchema = Joi.object({
    listing: Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required(),
        location: Joi.string().required(),
        price: Joi.number().required().min(0),
        gender: Joi.string().valid("boys", "girls", "coed"),        // 
        roomType: Joi.string().valid("single", "double", "triple"), // 
        amenities: Joi.array().items(Joi.string()),                 // 
        state: Joi.string().allow("", null),      
        contactInfo: Joi.string().required(),                   //
    }).required(),
}).unknown(true);

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(1).max(5),
        comment: Joi.string().required(),
    }).required(),
});