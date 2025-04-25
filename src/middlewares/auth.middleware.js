// auth.middleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');

module.exports = async (req, res, next) => {
  try {
    // Get token from header
 
    const tokenHeader = req.cookies?.accessToken || req.headers.authorization;
    
    if (!tokenHeader) {
    
      return res.status(401).json({ message: 'No authentication token provided' });
    }
    
    const token = tokenHeader
    console.log(token==req.cookies.accessToken)
    
    // Verify token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    // Find user

    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.log(error)
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
    res.status(500).json({ message: 'Authentication error', error: error.message });
  }
};
 





