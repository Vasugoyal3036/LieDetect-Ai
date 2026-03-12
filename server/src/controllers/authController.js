// Import User model
const User = require("../models/User");

// For password hashing
const bcrypt = require("bcryptjs");

// For generating unique magic link tokens
const crypto = require("crypto");

// For token generation
const jwt = require("jsonwebtoken");

// Email service
const { sendVerificationEmail, sendPasswordResetEmail, sendTwoFactorEmail } = require("../services/emailService");


// Function to generate JWT token
const generateToken = (id) => {
  return jwt.sign(
    { id }, // payload
    process.env.JWT_SECRET, // secret key
    { expiresIn: "2h" } // Session timeout basically
  );
};


// ---------------- SIGNUP ----------------
exports.signup = async (req, res) => {
  try {
    // Get data from request body
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique verification token using crypto module
    const verificationToken = crypto.randomBytes(32).toString('hex');

    let user;
    if (existingUser && !existingUser.isVerified) {
      // Update existing unverified user
      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.verificationToken = verificationToken;
      user = await existingUser.save();
    } else {
      // Create new user
      user = await User.create({
        name,
        email,
        password: hashedPassword,
        verificationToken,
        isVerified: false,
      });
    }

    // Send verification email with magic link
    await sendVerificationEmail(email, verificationToken, name);

    // Send response
    res.json({
      message: "Verification link sent to your email",
      email: user.email,
      requiresVerification: true,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Signup failed. Please try again." });
  }
};


// ---------------- VERIFY EMAIL (MAGIC LINK) ----------------
exports.verifyEmailLink = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Invalid or missing token" });
    }

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(404).json({ message: "Invalid verification link or user does not exist" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    // Mark as verified and clear token
    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    // Send response with token (now they're verified)
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
      message: "Email verified successfully."
    });
  } catch (error) {
    console.error("Verify email error:", error);
    res.status(500).json({ message: "Verification failed. Please try again." });
  }
};


// ---------------- RESEND VERIFICATION LINK ----------------
exports.resendVerificationLink = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    user.verificationToken = verificationToken;
    await user.save();

    // Send new verification email
    await sendVerificationEmail(email, verificationToken, user.name);

    res.json({ message: "New verification link sent to your email" });
  } catch (error) {
    console.error("Resend Link error:", error);
    res.status(500).json({ message: "Failed to resend link. Please try again." });
  }
};


// ---------------- LOGIN ----------------
exports.login = async (req, res) => {
  try {
    // Get credentials
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({
        message: "Email not verified. Please check your inbox for the verification link.",
        email: user.email,
        requiresVerification: true,
      });
    }

    // Check if 2FA is enabled
    if (user.isTwoFactorEnabled) {
      // Generate 6 digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Save OTP into user model locally
      user.twoFactorOTP = otp;
      user.twoFactorExpires = Date.now() + 600000; // 10 minutes logic
      await user.save();

      await sendTwoFactorEmail(user.email, otp, user.name);

      return res.status(200).json({
        message: "2FA code sent to your email",
        email: user.email,
        requiresTwoFactor: true,
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
      isTwoFactorEnabled: user.isTwoFactorEnabled,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
};


// ---------------- FORGOT PASSWORD ----------------
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Return success even if user not found for security (prevent email enumeration)
      return res.json({ message: "If your email is registered, you will receive a password reset link." });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Set token to expire in 1 hour
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour in ms

    await user.save();

    // Send reset email
    await sendPasswordResetEmail(user.email, resetToken, user.name);

    res.json({ message: "If your email is registered, you will receive a password reset link." });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Failed to process password reset request." });
  }
};


// ---------------- RESET PASSWORD ----------------
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required." });
    }

    // Find user by valid token and check expiration
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Password reset token is invalid or has expired." });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password and clear reset token fields
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    res.json({ message: "Your password has been successfully reset. You can now log in." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Failed to reset password. Please try again." });
  }
};


// ---------------- VERIFY 2FA ----------------
exports.verify2FA = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid user data." });
    }

    // Check if 2FA OTP matches and has not expired
    if (!user.twoFactorOTP || user.twoFactorOTP !== otp || user.twoFactorExpires < Date.now()) {
      return res.status(401).json({ message: "Invalid or expired 2FA code." });
    }

    // OTP correct: clean it up
    user.twoFactorOTP = null;
    user.twoFactorExpires = null;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
      isTwoFactorEnabled: user.isTwoFactorEnabled,
    });
  } catch (error) {
    console.error("2FA Error:", error);
    res.status(500).json({ message: "Failed to verify 2FA code." });
  }
};


// ---------------- TOGGLE 2FA ----------------
exports.toggle2FA = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    user.isTwoFactorEnabled = !user.isTwoFactorEnabled;
    await user.save();

    res.json({
      message: `Two-Factor Authentication is now ${user.isTwoFactorEnabled ? 'Enabled' : 'Disabled'}`,
      isTwoFactorEnabled: user.isTwoFactorEnabled
    });

  } catch (error) {
    console.error("Toggle 2FA Error:", error);
    res.status(500).json({ message: "Failed to toggle 2FA settings." });
  }
};


// ---------------- UPDATE PROFILE ----------------
exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
      isTwoFactorEnabled: user.isTwoFactorEnabled,
      role: user.role
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: "Failed to update profile." });
  }
};


// ---------------- CHANGE PASSWORD (LOGGED IN) ----------------
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect current password." });
    }

    // Hash and save new password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({ message: "Failed to change password." });
  }
};


// ---------------- GET ME ----------------
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    console.error("Get Me Error:", error);
    res.status(500).json({ message: "Failed to fetch profile info." });
  }
};


// ---------------- GOOGLE OAUTH LOGIN ----------------
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    
    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;
    
    // Check if user exists
    let user = await User.findOne({ email });
    
    if (user) {
      // If user exists, optionally verify them if they aren't
      if (!user.isVerified) {
        user.isVerified = true;
        user.verificationToken = null;
        await user.save();
      }
    } else {
      // If user doesn't exist, create a new verified user with dummy password
      const generatedPassword = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(generatedPassword, 10);
      
      user = await User.create({
        name,
        email,
        password: hashedPassword,
        isVerified: true, // Google handles verification automatically
      });
    }

    // Since they authenticated via Google, typically we bypass 2FA or we can enforce it.
    // Let's enforce it if two factor is strictly enabled on their account.
    if (user.isTwoFactorEnabled) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.twoFactorOTP = otp;
      user.twoFactorExpires = Date.now() + 600000;
      await user.save();

      await sendTwoFactorEmail(user.email, otp, user.name);

      return res.status(200).json({
        message: "2FA code sent to your email",
        email: user.email,
        requiresTwoFactor: true,
      });
    }

    // Success response
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
      isTwoFactorEnabled: user.isTwoFactorEnabled,
    });
    
  } catch (error) {
    console.error("Google Login Error:", error);
    res.status(500).json({ message: "Google authentication failed. Please try again or use standard login." });
  }
};
