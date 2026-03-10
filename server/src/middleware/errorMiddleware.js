const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation error',
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired, please login again' });
  }

  // Generic error
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({ message: 'Route not found' });
}

module.exports = { errorHandler, notFoundHandler };
