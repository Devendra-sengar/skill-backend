// Example routes: videoMonitoring.routes.js
const express = require('express');
const router = express.Router();
const videoMonitoringController = require('../controllers/videoMonitoring.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const ageVerificationMiddleware = require('../middlewares/ageVerification.middleware');
const premiumCheckMiddleware = require('../middlewares/premiumCheck.middleware');
const upload = require('../middlewares/upload.middleware');

// Video monitoring routes (premium users)
router.post('/upload', 
    authMiddleware, 
    upload.single('video'), 
    videoMonitoringController.uploadVideo
  );
  router.get('/my-videos', authMiddleware, videoMonitoringController.getMyVideos);
  router.get('/team-videos', authMiddleware, premiumCheckMiddleware, videoMonitoringController.getTeamMemberVideos);
  router.get('/:id', authMiddleware, videoMonitoringController.getVideoById);
  router.get('/player/:userId', authMiddleware, ageVerificationMiddleware, videoMonitoringController.getPlayerVideos);
  
  module.exports = router; 