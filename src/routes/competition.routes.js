// // Example routes: competition.routes.js
// const express = require('express');
// const router = express.Router();
// const competitionController = require('../controllers/competition.controller');
// const participationController = require('../controllers/participation.controller');
// // const authMiddleware = require('../middlewares/auth.middleware');
// // const ageVerificationMiddleware = require('../middlewares/ageVerification.middleware');

// // Competition routes
// router.get('/', competitionController.getAllCompetitions);
// //router.get('/upcoming', competitionController.getUpcomingCompetitions);
// //router.get('/active', competitionController.getActiveCompetitions);
// //router.get('/completed', competitionController.getCompletedCompetitions);
// router.get('/:id', competitionController.getCompetitionById);  

// // Participation routes
// router.post('/:id/register',  participationController.registerForCompetition);
// //router.get('/:id/questions',  participationController.getCompetitionQuestions);
// //router.post('/:id/submit',  participationController.submitAnswers);
// //router.get('/:id/results',  participationController.getCompetitionResults);
// router.get('/:id/leaderboard', competitionController.getCompetitionLeaderboard);
// router.get('/:id/analysis', participationController.getPerformanceAnalysis);
// router.post('/',  competitionController.createCompetition);

// // Get question templates for a specific tournament type
// router.get('/templates/:tournamentType',  competitionController.getQuestionTemplates);

// // Add questions to a tournament
// router.post('/:id/questions',  competitionController.addQuestions);

// // Update a tournament's status
// router.patch('/:id/status',  competitionController.updateCompetitionStatus);

// module.exports = router; 



// competition.routes.js
const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const competitionController = require('../controllers/competition.controller');
const participationController = require('../controllers/participation.controller');
 const authMiddleware = require('../middlewares/authMiddleware');
// const ageVerificationMiddleware = require('../middlewares/ageVerification.middleware');

router.use(authMiddleware.verifyToken);
// Competition routes
router.get('/query', competitionController.getAllCompetitions);
router.get('/', competitionController.getAllCompetitions1);
router.get('/:id', competitionController.getCompetitionById);  

// Participation routes - existing
router.post('/:id/register', participationController.registerForCompetition);
router.get('/:id/leaderboard', competitionController.getCompetitionLeaderboard);
router.get('/:id/analysis', participationController.getPerformanceAnalysis);
router.post('/', competitionController.createCompetition);

// Get question templates for a specific tournament type
router.get('/templates/:tournamentType', competitionController.getQuestionTemplates);

// Add questions to a tournament
router.post('/:id/questions', competitionController.addQuestions);

// Update a tournament's status
router.patch('/:id/status', competitionController.updateCompetitionStatus);

// New routes for enhanced team functionality
router.post('/:id/register-team', competitionController.registerTeam);
router.post('/:id/register-individual', competitionController.registerIndividual);
router.post('/:id/update-score', competitionController.updateParticipantScore);
router.post('/:id/distribute-prizes', competitionController.distributePrizes);
router.get('/:id/statistics', competitionController.getCompetitionStats);


//router.get('/:id/participation', competitionController.getParticipantStatus);

// Add batch questions to a tournament
router.post('/:tournamentId/questions/batch', questionController.addBatchQuestions);

// Add a single question to a tournament
router.post('/:tournamentId/questions/create', questionController.addQuestion);

// Remove a question from a tournament
router.delete('/:tournamentId/questions/:questionId', questionController.removeQuestion);

// Get all questions for a tournament
router.get('/:tournamentId/questions', questionController.getTournamentQuestions);
//router.post('/:tournamentId/start', competitionController.startCompetition);

module.exports = router;