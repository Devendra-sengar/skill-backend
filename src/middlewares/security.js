const rateLimit = require('express-rate-limit');
const xssClean = require('xss-clean');
const helmet = require('helmet');

// Rate Limiting Setup (40 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests, please try again later',
});

// Middleware to prevent XSS attacks
const xssProtection = xssClean();

// Security Headers Setup
const setSecurityHeaders = helmet();

module.exports = { limiter, xssProtection, setSecurityHeaders };
