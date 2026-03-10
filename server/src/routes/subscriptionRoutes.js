const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
    getSubscription,
    createCheckout,
    verifyPayment,
    cancelSubscription,
    trackUsage,
    getPlans,
    webhookHandler,
} = require("../controllers/subscriptionController");

router.get("/", protect, getSubscription);
router.get("/plans", getPlans);
router.post("/checkout", protect, createCheckout);
router.post("/verify-payment", protect, verifyPayment);
router.post("/cancel", protect, cancelSubscription);
router.post("/track-usage", protect, trackUsage);
router.post("/webhook", webhookHandler);

module.exports = router;
