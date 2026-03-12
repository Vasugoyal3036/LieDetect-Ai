const mongoose = require('mongoose');
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
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

        verificationToken: {
            type: String,
            default: null,
        },

        resetPasswordToken: {
            type: String,
            default: null,
        },

        resetPasswordExpires: {
            type: Date,
            default: null,
        },

        isTwoFactorEnabled: {
            type: Boolean,
            default: false,
        },

        twoFactorOTP: {
            type: String,
            default: null,
        },

        twoFactorExpires: {
            type: Date,
            default: null,
        },

        profilePicture: {
            type: String,
            default: null,
        },

        role: {
            type: String,
            enum: ['Admin', 'Recruiter', 'Interviewer'],
            default: 'Admin', // First user is Admin
        },

        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Points to the workspace owner Admin
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("User", userSchema);