// Example routes: user.routes.js
const express = require('express');
const router = express.Router();
const userController = require('../src/controllers/user.controller');
const profileController = require('../src/controllers/profile.controller');
const skillAssessmentController = require('../src/controllers/skillAssessment.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const ageVerificationMiddleware = require('../middlewares/ageVerification.middleware');
const upload = require('../middlewares/upload.middleware');

// User profile routes
router.get('/profile', authMiddleware, profileController.getProfile);
router.put('/profile', authMiddleware, profileController.updateProfile);
router.post('/profile/upload-picture', authMiddleware, upload.single('profilePicture'), profileController.uploadProfilePicture);

// Skill assessment routes
router.post('/assessment/take', authMiddleware, skillAssessmentController.takeAssessment);
router.get('/assessment/results', authMiddleware, skillAssessmentController.getAssessmentResults);
router.get('/assessment/history', authMiddleware, skillAssessmentController.getAssessmentHistory);

// Premium membership
router.post('/upgrade-premium', authMiddleware, ageVerificationMiddleware, userController.upgradeToPremium);
router.get('/premium-status', authMiddleware, userController.getPremiumStatus);

module.exports = router;