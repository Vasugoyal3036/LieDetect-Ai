const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { signupLimiter, authLimiter, passwordResetLimiter } = require("../middleware/rateLimiter");
const { 
    signup, login, verifyEmailLink, resendVerificationLink, 
    forgotPassword, resetPassword, verify2FA, googleLogin,
    toggle2FA, updateProfile, changePassword, getMe
} = require("../controllers/authController");

// Public - with rate limiting to prevent abuse
router.post("/signup", signupLimiter, signup);
router.post("/login", authLimiter, login);
router.post("/verify-email", verifyEmailLink);
router.post("/resend-link", resendVerificationLink);
router.post("/forgot-password", passwordResetLimiter, forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-2fa", authLimiter, verify2FA);
router.post("/google", authLimiter, googleLogin);

// Protected (requires user to be logged in)
router.get("/me", protect, getMe);
router.post("/toggle-2fa", protect, toggle2FA);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);

module.exports = router;
