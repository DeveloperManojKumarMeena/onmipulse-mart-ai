const mongoose = require('mongoose')

const addressSchema = new mongoose.Schema({
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String
});

let userSchema = new mongoose.Schema({
    userName: {
        type: String,
        unique: true,
        required: true
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
    },
    fullName: {
        firstName: { type: String, required: true },
        lastName: { type: String, }
    },
    role: {
        type: String,
        enum: ["user", 'seller'],
        default: "user",
        required: true
    },
    address: [addressSchema]

});

const userModel = mongoose.model("user", userSchema);

module.exports = userModel;