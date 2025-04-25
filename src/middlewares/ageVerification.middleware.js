// ageVerification.middleware.js
module.exports = (req, res, next) => {
    try {
      // Check if user is above 18
      if (!req.user.isAbove18) {
        return res.status(403).json({ 
          message: 'This feature is only available to users who are 18 or older'
        });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ message: 'Age verification error', error: error.message });
    }
  };