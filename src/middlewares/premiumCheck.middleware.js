// premiumCheck.middleware.js
module.exports = (req, res, next) => {
  try {
    // Check if user has premium membership
    if (!req.user.isPremium) {
      return res.status(403).json({ 
        message: 'This feature is only available to premium members',
        isPremium: false,
        upgradeUrl: '/api/users/upgrade-premium'
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ message: 'Premium verification error', error: error.message });
  }
};