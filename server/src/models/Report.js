const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    title: {
        type: String,
        default: "Interview Report",
    },
    sessions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Session",
    }],
    shareToken: {
        type: String,
        unique: true,
        required: true,
    },
    expiresAt: {
        type: Date,
    },
    viewCount: {
        type: Number,
        default: 0,
    },
    averageScore: {
        type: Number,
        default: 0,
    },
    overallRisk: {
        type: String,
        default: "Medium",
    },
}, { timestamps: true });

module.exports = mongoose.model("Report", reportSchema);
