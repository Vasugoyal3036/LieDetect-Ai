const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    plan: {
        type: String,
        enum: ["free", "pro", "enterprise"],
        default: "free",
    },
    razorpayPaymentId: {
        type: String,
        default: "",
    },
    razorpayOrderId: {
        type: String,
        default: "",
    },
    // Keep Stripe fields for backward compatibility
    stripeCustomerId: {
        type: String,
        default: "",
    },
    stripeSubscriptionId: {
        type: String,
        default: "",
    },
    status: {
        type: String,
        enum: ["active", "canceled", "past_due", "trialing", "inactive"],
        default: "active",
    },
    currentPeriodEnd: {
        type: Date,
    },
    features: {
        maxQuestionsPerMonth: { type: Number, default: 10 },
        maxQuestionBanks: { type: Number, default: 2 },
        maxReports: { type: Number, default: 1 },
        videoAnalysis: { type: Boolean, default: false },
        pdfExport: { type: Boolean, default: false },
        teamWorkspace: { type: Boolean, default: false },
        prioritySupport: { type: Boolean, default: false },
    },
    questionsUsedThisMonth: {
        type: Number,
        default: 0,
    },
    monthlyResetDate: {
        type: Date,
        default: () => new Date(),
    },
}, { timestamps: true });

module.exports = mongoose.model("Subscription", subscriptionSchema);
