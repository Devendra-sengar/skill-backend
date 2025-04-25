// Example routes: team.routes.js
const express = require('express');
const router = express.Router();
const teamController = require('../src/controllers/team.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const premiumCheckMiddleware = require('../middlewares/premiumCheck.middleware');
const ageVerificationMiddleware = require('../middlewares/ageVerification.middleware');

// Team routes (premium users only)
router.post('/', authMiddleware, ageVerificationMiddleware, premiumCheckMiddleware, teamController.createTeam);
router.get('/', authMiddleware, teamController.getMyTeams);
router.get('/:id', authMiddleware, teamController.getTeamById);
router.put('/:id', authMiddleware, premiumCheckMiddleware, teamController.updateTeam);

// Team invitation routes
router.post('/invite', authMiddleware, premiumCheckMiddleware, teamController.sendTeamInvite);
router.get('/invites/pending', authMiddleware, teamController.getPendingInvites);
router.post('/invites/:id/accept', authMiddleware, teamController.acceptInvite);
router.post('/invites/:id/reject', authMiddleware, teamController.rejectInvite);

// Team member management
router.get('/:id/members', authMiddleware, teamController.getTeamMembers);
router.delete('/:teamId/members/:userId', authMiddleware, premiumCheckMiddleware, teamController.removeTeamMember);

// Team performance
router.get('/:id/performance', authMiddleware, teamController.getTeamPerformance);

module.exports = router;