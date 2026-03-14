const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // limit each IP to 10 auth attempts per windowMs
  message: { message: 'Too many login attempts, please try again later.' },
  skipSuccessfulRequests: true,
});

// Stricter limiter for signup (prevent spam account creation)
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 signup attempts per hour
  message: { message: 'Too many accounts created from this IP. Please try again later.' },
  skipSuccessfulRequests: false,
});

// Stricter limiter for password reset (prevent abuse)
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset attempts per hour
  message: { message: 'Too many password reset requests. Please try again later.' },
  skipSuccessfulRequests: false,
});

// For debugging
console.log("✓ Rate limiters initialized");

module.exports = { limiter, authLimiter, signupLimiter, passwordResetLimiter };
