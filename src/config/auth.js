// config/auth.js
require('dotenv').config();

module.exports = {
  JWT_SECRET: 'your-temporary-jwt-secret-key-for-development',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  JWT_COOKIE_EXPIRES_IN: process.env.JWT_COOKIE_EXPIRES_IN || 1,
  
  // Password policies
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REQUIRES_SPECIAL: true,
  PASSWORD_REQUIRES_NUMBER: true,
  
  // Frontend URL for redirects
  FRONTEND_URL: 'https://ugskill-frontend.vercel.app',
  
  // Token expiry times (in milliseconds)
  EMAIL_VERIFICATION_EXPIRES: 24 * 60 * 60 * 1000, // 24 hours
  PASSWORD_RESET_EXPIRES: 10 * 60 * 1000, // 10 minutes
  
  // Security settings
  BCRYPT_SALT_ROUNDS: 12,
  
  // Rate limiting
  LOGIN_RATE_LIMIT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 failed attempts
    message: 'Too many login attempts, please try again later'
  },
  
  // Session settings
  SESSION_SECRET: process.env.SESSION_SECRET || 'your-temporary-session-secret-for-development',
  SESSION_EXPIRES: 60 * 60 * 1000 * 24 // 24 hours
};