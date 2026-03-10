const Subscription = require("../models/Subscription");
const { getRazorpay } = require("../config/razorpay");
const crypto = require("crypto");

const PLAN_LIMITS = {
    free: {
        maxQuestionsPerMonth: 10,
        maxQuestionBanks: 2,
        maxReports: 1,
        videoAnalysis: false,
        pdfExport: false,
        teamWorkspace: false,
        prioritySupport: false,
    },
    pro: {
        maxQuestionsPerMonth: 100,
        maxQuestionBanks: 20,
        maxReports: 50,
        videoAnalysis: true,
        pdfExport: true,
        teamWorkspace: false,
        prioritySupport: true,
    },
    enterprise: {
        maxQuestionsPerMonth: 9999,
        maxQuestionBanks: 9999,
        maxReports: 9999,
        videoAnalysis: true,
        pdfExport: true,
        teamWorkspace: true,
        prioritySupport: true,
    },
};

const PLAN_PRICES = {
    pro: 2499,        // ₹2,499/month (in paisa: 249900)
    enterprise: 7999,  // ₹7,999/month (in paisa: 799900)
};

// Get or create subscription for current user
exports.getSubscription = async (req, res) => {
    try {
        let sub = await Subscription.findOne({ user: req.user._id });
        if (!sub) {
            sub = await Subscription.create({
                user: req.user._id,
                plan: "free",
                features: PLAN_LIMITS.free,
            });
        }

        // Auto-reset monthly usage
        const now = new Date();
        if (sub.monthlyResetDate && now.getMonth() !== sub.monthlyResetDate.getMonth()) {
            sub.questionsUsedThisMonth = 0;
            sub.monthlyResetDate = now;
            await sub.save();
        }

        res.json(sub);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch subscription", error: error.message });
    }
};

// Create Razorpay order for subscription checkout
exports.createCheckout = async (req, res) => {
    try {
        const { plan } = req.body;
        if (!["pro", "enterprise"].includes(plan)) {
            return res.status(400).json({ message: "Invalid plan selected" });
        }

        const razorpay = getRazorpay();

        // If Razorpay is not configured, simulate the upgrade
        if (!razorpay) {
            let sub = await Subscription.findOne({ user: req.user._id });
            if (!sub) {
                sub = await Subscription.create({ user: req.user._id, plan: "free", features: PLAN_LIMITS.free });
            }

            sub.plan = plan;
            sub.status = "active";
            sub.features = PLAN_LIMITS[plan];
            sub.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            await sub.save();

            return res.json({
                message: `Upgraded to ${plan} plan! (Demo mode)`,
                subscription: sub,
                demo: true,
            });
        }

        // Create Razorpay order
        const amount = PLAN_PRICES[plan] * 100; // Convert to paisa
        const receipt = `rcpt_${Date.now()}`;

        console.log("Creating Razorpay order:", { amount, plan, receipt });

        const order = await razorpay.orders.create({
            amount,
            currency: "INR",
            receipt,
            notes: {
                userId: String(req.user._id),
                plan,
            },
        });

        console.log("Razorpay order created:", order.id);

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            plan,
            keyId: process.env.RAZORPAY_KEY_ID,
        });
    } catch (error) {
        console.error("Checkout error:", error);
        res.status(500).json({ message: "Checkout failed", error: error.message });
    }
};

// Verify Razorpay payment and activate subscription
exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;

        const razorpay = getRazorpay();

        if (!razorpay) {
            return res.status(400).json({ message: "Payment gateway not configured" });
        }

        // Verify signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: "Payment verification failed. Invalid signature." });
        }

        // Activate subscription
        let sub = await Subscription.findOne({ user: req.user._id });
        if (!sub) {
            sub = await Subscription.create({ user: req.user._id, plan: "free", features: PLAN_LIMITS.free });
        }

        sub.plan = plan;
        sub.status = "active";
        sub.features = PLAN_LIMITS[plan];
        sub.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        sub.razorpayPaymentId = razorpay_payment_id;
        sub.razorpayOrderId = razorpay_order_id;
        sub.questionsUsedThisMonth = 0;
        sub.monthlyResetDate = new Date();
        await sub.save();

        res.json({
            message: `Successfully upgraded to ${plan} plan!`,
            subscription: sub,
        });
    } catch (error) {
        console.error("Payment verification error:", error);
        res.status(500).json({ message: "Payment verification failed", error: error.message });
    }
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
    try {
        const sub = await Subscription.findOne({ user: req.user._id });
        if (!sub) return res.status(404).json({ message: "No subscription found" });

        sub.plan = "free";
        sub.status = "canceled";
        sub.features = PLAN_LIMITS.free;
        sub.razorpayPaymentId = "";
        sub.razorpayOrderId = "";
        await sub.save();

        res.json({ message: "Subscription canceled. Downgraded to free plan.", subscription: sub });
    } catch (error) {
        res.status(500).json({ message: "Failed to cancel subscription", error: error.message });
    }
};

// Track usage (called whenever a question is analyzed)
exports.trackUsage = async (req, res) => {
    try {
        let sub = await Subscription.findOne({ user: req.user._id });
        if (!sub) {
            sub = await Subscription.create({ user: req.user._id, plan: "free", features: PLAN_LIMITS.free });
        }

        if (sub.questionsUsedThisMonth >= sub.features.maxQuestionsPerMonth) {
            return res.status(429).json({
                message: "Monthly question limit reached. Upgrade your plan for more.",
                limit: sub.features.maxQuestionsPerMonth,
                used: sub.questionsUsedThisMonth,
            });
        }

        sub.questionsUsedThisMonth += 1;
        await sub.save();

        res.json({
            used: sub.questionsUsedThisMonth,
            limit: sub.features.maxQuestionsPerMonth,
            remaining: sub.features.maxQuestionsPerMonth - sub.questionsUsedThisMonth,
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to track usage", error: error.message });
    }
};

// Razorpay webhook handler
exports.webhookHandler = async (req, res) => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (webhookSecret) {
            const shasum = crypto.createHmac("sha256", webhookSecret);
            shasum.update(JSON.stringify(req.body));
            const digest = shasum.digest("hex");

            if (digest !== req.headers["x-razorpay-signature"]) {
                return res.status(400).json({ message: "Invalid webhook signature" });
            }
        }

        const event = req.body.event;

        if (event === "payment.captured") {
            const payment = req.body.payload.payment.entity;
            const userId = payment.notes?.userId;
            const plan = payment.notes?.plan;

            if (userId && plan) {
                let sub = await Subscription.findOne({ user: userId });
                if (sub) {
                    sub.plan = plan;
                    sub.status = "active";
                    sub.features = PLAN_LIMITS[plan];
                    sub.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                    sub.razorpayPaymentId = payment.id;
                    await sub.save();
                }
            }
        }

        res.json({ received: true });
    } catch (error) {
        console.error("Webhook error:", error);
        res.status(500).json({ message: "Webhook processing failed" });
    }
};

// Get plan limits info
exports.getPlans = async (req, res) => {
    res.json({
        limits: PLAN_LIMITS,
        prices: PLAN_PRICES,
        currency: "INR",
    });
};
