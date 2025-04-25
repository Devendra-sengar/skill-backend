// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/User');
const { formatResponse } = require('../utils/formatter');
const config = require('../config/auth'); 

// Verify user token
exports.verifyToken = async (req, res, next) => {
  try {
    let token;
    console.log("cokkies" , req.cookies)
    // Get token from authorization header or cookies
   // Get token from authorization header or cookies
   console.log( req.headers.authorization)
if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
  token = req.headers.authorization.split(' ')[1];
} else if (req.cookies.token) {  // Changed from req.cookies.jwt to req.cookies.token
  token = req.cookies.token;
}
    
    // Check if token exists
    if (!token) {
      return res.status(401).json(formatResponse(false, null, 'You are not logged in. Please log in to access this resource.'));
    }
    
    // Verify token
    const decoded = await promisify(jwt.verify)(token, config.JWT_SECRET);
    console.log(decoded)
    // Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json(formatResponse(false, null, 'The user belonging to this token no longer exists.'));
    }
    
    // Check if user changed password after token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json(formatResponse(false, null, 'User recently changed password. Please log in again.'));
    }
    
    // Add user to request object
    req.user = currentUser;
    next();
  } catch (error) {
    return res.status(401).json(formatResponse(false, null, 'Invalid token. Please log in again.'));
  }
};

// Check for user role
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json(formatResponse(false, null, 'You do not have permission to perform this action'));
    }
    next();
  };
};

// Check for premium subscription
exports.premiumRequired = async (req, res, next) => {
  try {
    // Check if user has premium subscription
    if (req.user.subscriptionStatus !== 'premium' || 
        !req.user.subscriptionExpiry || 
        req.user.subscriptionExpiry < Date.now()) {
      return res.status(403).json(formatResponse(false, null, 'This feature requires a premium subscription'));
    }
    next();
  } catch (error) {
    next(error);
  }
};

// Optional auth - doesn't require login but attaches user if logged in
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;
    
    // Get token from authorization header or cookies
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    
    // If no token, continue without user
    if (!token) {
      return next();
    }
    
    // Verify token
    try {
      const decoded = await promisify(jwt.verify)(token, config.JWT_SECRET);
      
      // Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser || currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }
      
      // Add user to request object
      req.user = currentUser;
    } catch (err) {
      // Invalid token, continue without user
    }
    
    next();
  } catch (error) {
    next(error);
  }
};