const mongoose = require("mongoose");

const questionBankSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: "",
    },
    jobRole: {
        type: String,
        default: "",
    },
    questions: [{
        text: { type: String, required: true },
        category: { type: String, default: "general" },
    }],
    isPublic: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

module.exports = mongoose.model("QuestionBank", questionBankSchema);
