const express = require('express');
const router = express.Router();
const bettingController = require('../controllers/betting.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const ageVerificationMiddleware = require('../middlewares/ageVerification.middleware');

// Betting routes (18+ only)
router.get('/options', authMiddleware, ageVerificationMiddleware, bettingController.getBettingOptions);
router.post('/self-challenge', authMiddleware, ageVerificationMiddleware, bettingController.placeSelfChallengeBet);
router.post('/player', authMiddleware, ageVerificationMiddleware, bettingController.placeBetOnPlayer);
router.post('/team', authMiddleware, ageVerificationMiddleware, bettingController.placeBetOnTeam);
router.post('/performance', authMiddleware, ageVerificationMiddleware, bettingController.placePredictionBet);
router.get('/history', authMiddleware, ageVerificationMiddleware, bettingController.getBettingHistory);
router.get('/active', authMiddleware, ageVerificationMiddleware, bettingController.getActiveBets);
router.get('/outcomes', authMiddleware, ageVerificationMiddleware, bettingController.getBetOutcomes);

module.exports = router;