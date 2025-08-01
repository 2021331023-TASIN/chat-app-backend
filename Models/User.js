// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    otp: {
        type: String,
    },
    otpExpires: {
        type: Date,
    },
    // ✅ NEW FIELD: Add the avatarUrl field here with a default value
    avatarUrl: {
        type: String,
        default: 'https://i.ibb.co/3s3p72d/avatar1.png', 
    },
}, {
    timestamps: true, // Adds createdAt and updatedAt fields
});

const User = mongoose.model('User', userSchema);
export default User;