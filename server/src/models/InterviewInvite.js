const mongoose = require("mongoose");

const interviewInviteSchema = new mongoose.Schema({
    recruiterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    workspaceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    candidateName: {
        type: String,
        required: true,
    },
    candidateEmail: {
        type: String,
        required: true,
    },
    questionBankId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "QuestionBank",
        default: null, // null means use default questions
    },
    token: {
        type: String,
        required: true,
        unique: true,
    },
    status: {
        type: String,
        enum: ["Pending", "Completed", "Expired"],
        default: "Pending",
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    reportId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Report",
        default: null,
    },
    sessions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Session"
    }]
}, { timestamps: true });

module.exports = mongoose.model("InterviewInvite", interviewInviteSchema);
