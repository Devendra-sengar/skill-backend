// routes/participation.routes.js
const express = require('express');
const router = express.Router();
const participationController = require('../controllers/participation.controller');
const authMiddleware = require('../middlewares/authMiddleware');

// Apply auth middleware to all participation routes

router.use(authMiddleware.verifyToken);


router.get('/:id',participationController.getParticipantStatus)
/**
 * @route POST /api/participations/competitions/:id/register
 * @desc Register a user for a competition
 * @access Private
 */
router.post('/:id/start', participationController.startCompetition);
router.post('/:id/register', participationController.registerForCompetition);
router.get('/:id/start',participationController.getParticipant);
/**
 * @route GET /api/participations/competitions/:id/analysis
 * @desc Get performance analysis for a completed competition
 * @access Private
 */
router.get('/:id/analysis', participationController.getPerformanceAnalysis);


router.post('/:id/answers/submit', participationController.submitAnswersBatch);
router.post('/:id/complete',participationController.completeCompetition);

// Get leaderboard for a competition
router.get('/leaderboard/:competitionId', participationController.getLeaderboard);

// Get detailed participant information

module.exports = router;