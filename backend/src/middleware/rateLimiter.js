const rateLimit = require('express-rate-limit');

// Rate limiting middleware to prevent abuse
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  },
  skip: () => process.env.NODE_ENV === 'test'
});

module.exports = {
  apiLimiter
};
