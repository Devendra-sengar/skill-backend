// const express = require('express');
// const router = express.Router();
// const { register, login, logout, updateProfile } = require('../controllers/authController');
// const { verifyAccessToken } = require('../middlewares/auth.middleware');
// const { limiter, xssProtection, setSecurityHeaders } = require('../middlewares/security');
// const authMiddleware = require('../middlewares/auth.middleware');

// // Apply security middleware globally
// // router.use(setSecurityHeaders);
// // router.use(xssProtection);

// // Routes for authentication
// router.post('/register', register);
// router.post('/login', login);
// router.post('/logout',authMiddleware,logout);
// //router.put('/update-profile', verifyAccessToken, updateProfile);

// module.exports = router;
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const passport = require('passport');

console.log('Auth routes loaded'); // Debugging line
// Refresh token
// router.post('/refresh-token', authController.refreshToken);
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', authController.googleCallback);
router
// Check if email exists (for social login)
router.post('/check-email', authController.checkEmail);
// Link/unlink Google account (requires authentication)
router.post('/link-google', authController.linkGoogleAccount);
router.post('/unlink-google', authController.unlinkGoogleAccount);

module.exports = router;