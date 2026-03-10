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

module.exports = { limiter, authLimiter };
