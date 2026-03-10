const Razorpay = require("razorpay");

let razorpayInstance = null;

function getRazorpay() {
    if (!razorpayInstance) {
        const key_id = process.env.RAZORPAY_KEY_ID;
        const key_secret = process.env.RAZORPAY_KEY_SECRET;

        if (!key_id || !key_secret) {
            console.warn("⚠️ Razorpay keys not configured. Payment features will be simulated.");
            return null;
        }

        razorpayInstance = new Razorpay({
            key_id,
            key_secret,
        });
    }
    return razorpayInstance;
}

module.exports = { getRazorpay };
