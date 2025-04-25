// // competition.controller.js
// const Competition = require('../models/Competition');
// const Participation = require('../models/participation');
// const mongoose = require('mongoose');

// exports.getAllCompetitions = async (req, res) => {
//   try {
//     const { subject, gradeLevel, tournamentType, status } = req.query;
//     const query = {};
    
//     if (subject) query.subject = subject;
//     if (gradeLevel) query.gradeLevel = gradeLevel;
//     if (tournamentType) query.tournamentType = tournamentType;
//     if (status) query.status = status;
    
//     const competitions = await Competition.find(query)
//       .sort({ startTime: 1 })
//       .select('title subject gradeLevel tournamentType; startTime endTime entryFee prizePool status currentParticipants');
    
//     res.json(competitions);
//   } catch (error) {
//     res.status(500).json({ message: 'Error fetching competitions', error: error.message });
//   }
// };

// exports.getCompetitionById = async (req, res) => {
//   try {
//     const competition = await Competition.findById(req.params.id)
//       .select('-questions');
    
//     if (!competition) {
//       return res.status(404).json({ message: 'Competition not found' });
//     }
    
//     res.json(competition);
//   } catch (error) {
//     res.status(500).json({ message: 'Error fetching competition', error: error.message });
//   }
// };

// exports.getCompetitionLeaderboard = async (req, res) => {
//   try {
//     const competitionId = req.params.id;
    
//     // Validate that the competition exists
//     const competition = await Competition.findById(competitionId);
//     if (!competition) {
//       return res.status(404).json({ message: 'Competition not found' });
//     }
    
//     // Get all participations for this competition, sorted by score
//     const leaderboard = await Participation.find({ competitionId })
//       .sort({ score: -1 }) // sort by score in descending order
//       .populate('userId', 'username profile.fullName')
//       .select('userId score rank completedAt');
    
//     // Update ranks if needed
//     if (competition.status === 'completed' && leaderboard.length > 0) {
//       // Ensure ranks are assigned correctly
//       for (let i = 0; i < leaderboard.length; i++) {
//         if (!leaderboard[i].rank || leaderboard[i].rank !== i + 1) {
//           leaderboard[i].rank = i + 1;
//           await leaderboard[i].save();
//         }
//       }
//     }
    
//     res.json(leaderboard);
//   } catch (error) {
//     res.status(500).json({ message: 'Error fetching leaderboard', error: error.message });
//   }
// };






// /**
//  * Create a new tournament/competition
//  * @param {Object} req - Express request object
//  * @param {Object} res - Express response object
//  * @returns {Object} JSON response with created competition or error
//  */
// exports.createCompetition = async (req, res) => {
//   try {
//     // Extract competition data from request body
//     const {
//       title,
//       description,
//       subject,
//       gradeLevel,
//       tournamentType,
//       startTime,
//       endTime,
//       registrationDeadline,
//       entryFee,
//       prizePool,
//       maxParticipants,
//       difficulty,
//       isVirtual,
//       location,
//       platformFeePercentage = 20 // Default to 20% if not provided
//     } = req.body;

//     // Input validation
//     if (!title || !subject || !tournamentType || !startTime || !endTime || !registrationDeadline) {
//       return res.status(400).json({ 
//         message: 'Missing required fields', 
//         required: 'title, subject, tournamentType, startTime, endTime, registrationDeadline' 
//       });
//     }

//     // Validate dates
//     const start = new Date(startTime);
//     const end = new Date(endTime);
//     const deadline = new Date(registrationDeadline);
    
//     // Check if dates are valid
//     if (isNaN(start.getTime()) || isNaN(end.getTime()) || isNaN(deadline.getTime())) {
//       return res.status(400).json({ message: 'Invalid date format' });
//     }

//     // Check if end time is after start time
//     if (end <= start) {
//       return res.status(400).json({ message: 'End time must be after start time' });
//     }

//     // Check if registration deadline is before start time
//     if (deadline >= start) {
//       return res.status(400).json({ message: 'Registration deadline must be before start time' });
//     }

//     // Validate numeric fields
//     if (entryFee < 0) {
//       return res.status(400).json({ message: 'Entry fee cannot be negative' });
//     }

//     if (maxParticipants <= 0) {
//       return res.status(400).json({ message: 'Maximum participants must be greater than zero' });
//     }

//     if (prizePool <= 0) {
//       return res.status(400).json({ message: 'Prize pool must be greater than zero' });
//     }

//     // Initial calculations for financial tracking
//     const totalAmountCollected = 0; // Will be updated as participants register
//     const platformFeeAmount = 0; // Will be updated as participants register

//     // Create new competition document
//     const newCompetition = new Competition({
//       title,
//       description,
//       subject,
//       gradeLevel,
//       tournamentType,
//       startTime,
//       endTime,
//       registrationDeadline,
//       entryFee,
//       prizePool,
//       maxParticipants,
//       difficulty,
//       location: isVirtual ? 'Virtual' : location,
//       platformFeePercentage,
//       totalAmountCollected,
//       platformFeeAmount,
//       status: 'upcoming', // Default status for new tournaments
//       currentParticipants: 0, // No participants initially
//       questions: [] // No questions initially
//     });

//     // Save the competition to the database
//     await newCompetition.save();

//     // Respond with the created competition
//     res.status(201).json({
//       message: 'Tournament created successfully',
//       competition: {
//         id: newCompetition._id,
//         title: newCompetition.title,
//         subject: newCompetition.subject,
//         tournamentType: newCompetition.tournamentType,
//         startTime: newCompetition.startTime,
//         endTime: newCompetition.endTime,
//         status: newCompetition.status
//       }
//     });
//   } catch (error) {
//     console.error('Error creating competition:', error);
    
//     // Handle Mongoose validation errors
//     if (error.name === 'ValidationError') {
//       const validationErrors = {};
//       for (const field in error.errors) {
//         validationErrors[field] = error.errors[field].message;
//       }
//       return res.status(400).json({ 
//         message: 'Validation error', 
//         errors: validationErrors 
//       });
//     }
    
//     // Handle duplicate key errors (e.g., if title must be unique)
//     if (error.code === 11000) {
//       return res.status(409).json({ 
//         message: 'A tournament with this title already exists' 
//       });
//     }

//     // Handle other errors
//     res.status(500).json({ 
//       message: 'Error creating tournament', 
//       error: error.message 
//     });
//   }
// };

// /**
//  * Get questions template for a specific tournament type
//  * @param {Object} req - Express request object
//  * @param {Object} res - Express response object
//  * @returns {Object} JSON response with question templates
//  */
// exports.getQuestionTemplates = async (req, res) => {
//   try {
//     const { tournamentType } = req.params;
    
//     // Define question templates based on tournament type
//     const questionTemplates = {
//       quiz: [
//         { type: 'multiple_choice', points: 5, difficulty: 'easy' },
//         { type: 'multiple_choice', points: 10, difficulty: 'medium' },
//         { type: 'true_false', points: 5, difficulty: 'easy' }
//       ],
//       hackathon: [
//         { type: 'coding', points: 20, difficulty: 'medium' },
//         { type: 'design', points: 15, difficulty: 'medium' }
//       ],
//       case_study: [
//         { type: 'analysis', points: 25, difficulty: 'hard' },
//         { type: 'presentation', points: 20, difficulty: 'medium' }
//       ],
//       gaming: [
//         { type: 'performance', points: 30, difficulty: 'varies' }
//       ],
//       other: [
//         { type: 'custom', points: 10, difficulty: 'custom' }
//       ]
//     };
    
//     // Return the appropriate templates or a default empty array
//     const templates = questionTemplates[tournamentType] || [];
    
//     res.json({ 
//       tournamentType, 
//       templates 
//     });
//   } catch (error) {
//     console.error('Error fetching question templates:', error);
//     res.status(500).json({ 
//       message: 'Error fetching question templates', 
//       error: error.message 
//     });
//   }
// };

// /**
//  * Add questions to a tournament
//  * @param {Object} req - Express request object
//  * @param {Object} res - Express response object
//  * @returns {Object} JSON response with updated competition
//  */
// exports.addQuestions = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { questions } = req.body;
    
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ message: 'Invalid tournament ID' });
//     }
    
//     if (!Array.isArray(questions) || questions.length === 0) {
//       return res.status(400).json({ message: 'Questions must be a non-empty array' });
//     }
    
//     // Find the tournament
//     const competition = await Competition.findById(id);
    
//     if (!competition) {
//       return res.status(404).json({ message: 'Tournament not found' });
//     }
    
//     // Create question documents and add their IDs to the competition
//     // Here you would typically use a Question model and create the questions
//     // For demonstration, we're just adding the question IDs to the competition
    
//     // Update the competition with question IDs
//     competition.questions = questions.map(q => q._id || new mongoose.Types.ObjectId());
    
//     await competition.save();
    
//     res.json({ 
//       message: 'Questions added successfully', 
//       competitionId: competition._id,
//       questionCount: competition.questions.length 
//     });
//   } catch (error) {
//     console.error('Error adding questions:', error);
//     res.status(500).json({ 
//       message: 'Error adding questions to tournament', 
//       error: error.message 
//     });
//   }
// };

// /**
//  * Update a tournament's status
//  * @param {Object} req - Express request object
//  * @param {Object} res - Express response object
//  * @returns {Object} JSON response with updated status
//  */
// exports.updateCompetitionStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;
    
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ message: 'Invalid tournament ID' });
//     }
    
//     const validStatuses = ['upcoming', 'active', 'completed', 'cancelled'];
//     if (!validStatuses.includes(status)) {
//       return res.status(400).json({ 
//         message: 'Invalid status', 
//         validOptions: validStatuses 
//       });
//     }
    
//     const competition = await Competition.findById(id);
    
//     if (!competition) {
//       return res.status(404).json({ message: 'Tournament not found' });
//     }
    
//     competition.status = status;
//     await competition.save();
    
//     res.json({ 
//       message: 'Tournament status updated', 
//       competitionId: competition._id,
//       status: competition.status 
//     });
//   } catch (error) {
//     console.error('Error updating competition status:', error);
//     res.status(500).json({ 
//       message: 'Error updating tournament status', 
//       error: error.message 
//     });
//   }
// };


// competition.controller.js
const Competition = require('../models/Competition');
const Participation = require('../models/Participation');
const Team = require('../models/TeamModel');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Get all competitions with optional filtering
 */
exports.getAllCompetitions = async (req, res) => {
  try {
    const { subject, gradeLevel, tournamentType, status } = req.query;
    const query = {};
    
    if (subject) query.subject = subject;
    if (gradeLevel) query.gradeLevel = gradeLevel;
    if (tournamentType) query.tournamentType = tournamentType;
    if (status) query.status = status;
    
    const competitions = await Competition.find(query)
      .sort({ startTime: 1 })
      .select('title subject gradeLevel tournamentType startTime endTime entryFee prizePool status currentParticipants isTeamTournament');
    
    res.json(competitions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching competitions', error: error.message });
  }
};

exports.getAllCompetitions1 = async (req, res) => {
  try {
   
    
    const competitions = await Competition.find()
      .sort({ startTime: 1 })
    
    res.json(competitions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching competitions', error: error.message });
  }
};
/**
 * Get competition by ID
 */
exports.getCompetitionById = async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id)
      .select('-questions');
    
    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }
    
    res.json(competition);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching competition', error: error.message });
  }
};

/**
 * Get competition leaderboard
 */
exports.getCompetitionLeaderboard = async (req, res) => {
  try {
    const competitionId = req.params.id;
    
    // Validate that the competition exists
    const competition = await Competition.findById(competitionId);
    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }
    
    let leaderboard = [];
    
    if (competition.isTeamTournament) {
      // For team tournaments, get team leaderboard
      leaderboard = competition.participatingTeams
        .sort((a, b) => {
          if (a.score !== b.score) return b.score - a.score;
          return a.completionTime - b.completionTime;
        })
        .map((entry, index) => ({
          rank: index + 1,
          teamId: entry.teamId,
          score: entry.score,
          completionTime: entry.completionTime,
          prizeWon: entry.prizeWon
        }));
      
      // Populate team details
      const populatedLeaderboard = await Promise.all(
        leaderboard.map(async (entry) => {
          const team = await Team.findById(entry.teamId).select('name ownerId members');
          return {
            ...entry,
            teamName: team ? team.name : 'Unknown Team',
            teamOwner: team ? team.ownerId : null,
            memberCount: team ? team.members.length : 0
          };
        })
      );
      
      leaderboard = populatedLeaderboard;
    } else {
      // For individual tournaments
      // Get all participations for this competition, sorted by score
      leaderboard = competition.individualParticipants
        .sort((a, b) => {
          if (a.score !== b.score) return b.score - a.score;
          return a.completionTime - b.completionTime;
        })
        .map((entry, index) => ({
          rank: index + 1,
          userId: entry.userId,
          score: entry.score,
          completionTime: entry.completionTime,
          prizeWon: entry.prizeWon
        }));
      
      // Populate user details
      const populatedLeaderboard = await Promise.all(
        leaderboard.map(async (entry) => {
          const user = await User.findById(entry.userId).select('username profile.fullName');
          return {
            ...entry,
            username: user ? user.username : 'Unknown User',
            fullName: user && user.profile ? user.profile.fullName : null
          };
        })
      );
      
      leaderboard = populatedLeaderboard;
    }
    
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leaderboard', error: error.message });
  }
};

/**
 * Create a new tournament/competition
 */
exports.createCompetition = async (req, res) => {
  try {
    // Extract competition data from request body
    const {
      title,
      description,
      subject,
      gradeLevel,
      tournamentType,
      startTime,
      endTime,
      registrationDeadline,
      entryFee,
      prizePool,
      maxParticipants,
      difficulty,
      isVirtual,
      location,
      timeDuration,
      isTeamTournament = false, // Default to individual tournament
      platformFeePercentage = 20 // Default to 20% if not provided
    } = req.body;

    // Input validation
    if (!title || !subject || !tournamentType || !startTime || !endTime) {
      return res.status(400).json({ 
        message: 'Missing required fields', 
        required: 'title, subject, tournamentType, startTime, endTime' 
      });
    }

    // Validate dates
    const start = new Date(startTime);
    const end = new Date(endTime);
    const deadline = registrationDeadline ? new Date(registrationDeadline) : null;
    
    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || (deadline && isNaN(deadline.getTime()))) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Check if end time is after start time
    if (end <= start) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    // Check if registration deadline is before start time
    if (deadline && deadline >= start) {
      return res.status(400).json({ message: 'Registration deadline must be before start time' });
    }

    // Validate numeric fields
    if (entryFee < 0) {
      return res.status(400).json({ message: 'Entry fee cannot be negative' });
    }

    if (maxParticipants && maxParticipants <= 0) {
      return res.status(400).json({ message: 'Maximum participants must be greater than zero' });
    }

    if (prizePool && prizePool <= 0) {
      return res.status(400).json({ message: 'Prize pool must be greater than zero' });
    }

    // Create new competition document
    const newCompetition = new Competition({
      title,
      description,
      subject,
      gradeLevel,
      tournamentType,
      startTime,
      endTime,
      registrationDeadline: deadline,
      entryFee,
      prizePool: prizePool || 0,
      maxParticipants,
      difficulty,
      location: isVirtual ? 'Virtual' : location,
      platformFeePercentage,
      totalAmountCollected: 0,
      platformFeeAmount: 0,
      isTeamTournament,
      timeDuration,
      status: 'upcoming', // Default status for new tournaments
      currentParticipants: 0, // No participants initially
      questions: [], // No questions initially
      participatingTeams: [], // Empty teams array
      individualParticipants: [] // Empty individuals array
    });

    // Save the competition to the database
    await newCompetition.save();

    // Respond with the created competition
    res.status(201).json({
      message: 'Tournament created successfully',
      competition: {
        id: newCompetition._id,
        title: newCompetition.title,
        subject: newCompetition.subject,
        tournamentType: newCompetition.tournamentType,
        startTime: newCompetition.startTime,
        endTime: newCompetition.endTime,
        isTeamTournament: newCompetition.isTeamTournament,
        status: newCompetition.status
      }
    });
  } catch (error) {
    console.error('Error creating competition:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      for (const field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: validationErrors 
      });
    }
    
    // Handle duplicate key errors (e.g., if title must be unique)
    if (error.code === 11000) {
      return res.status(409).json({ 
        message: 'A tournament with this title already exists' 
      });
    }

    // Handle other errors
    res.status(500).json({ 
      message: 'Error creating tournament', 
      error: error.message 
    });
  }
};

/**
 * Get questions template for a specific tournament type
 */
exports.getQuestionTemplates = async (req, res) => {
  try {
    const { tournamentType } = req.params;
    
    // Define question templates based on tournament type
    const questionTemplates = {
      quiz: [
        { type: 'multiple_choice', points: 5, difficulty: 'easy' },
        { type: 'multiple_choice', points: 10, difficulty: 'medium' },
        { type: 'true_false', points: 5, difficulty: 'easy' }
      ],
      hackathon: [
        { type: 'coding', points: 20, difficulty: 'medium' },
        { type: 'design', points: 15, difficulty: 'medium' }
      ],
      case_study: [
        { type: 'analysis', points: 25, difficulty: 'hard' },
        { type: 'presentation', points: 20, difficulty: 'medium' }
      ],
      gaming: [
        { type: 'performance', points: 30, difficulty: 'varies' }
      ],
      other: [
        { type: 'custom', points: 10, difficulty: 'custom' }
      ]
    };
    
    // Return the appropriate templates or a default empty array
    const templates = questionTemplates[tournamentType] || [];
    
    res.json({ 
      tournamentType, 
      templates 
    });
  } catch (error) {
    console.error('Error fetching question templates:', error);
    res.status(500).json({ 
      message: 'Error fetching question templates', 
      error: error.message 
    });
  }
};

/**
 * Add questions to a tournament
 */
exports.addQuestions = async (req, res) => {
  try {
    const { id } = req.params;
    const { questions } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid tournament ID' });
    }
    
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'Questions must be a non-empty array' });
    }
    
    // Find the tournament
    const competition = await Competition.findById(id);
    
    if (!competition) {
      return res.status(404).json({ message: 'Tournament not found' });
    }
    
    // Add questions to the competition using the model method
    await competition.addQuestions(questions.map(q => q._id || new mongoose.Types.ObjectId()));
    
    res.json({ 
      message: 'Questions added successfully', 
      competitionId: competition._id,
      questionCount: competition.questions.length 
    });
  } catch (error) {
    console.error('Error adding questions:', error);
    res.status(500).json({ 
      message: 'Error adding questions to tournament', 
      error: error.message 
    });
  }
};

/**
 * Update a tournament's status
 */
exports.updateCompetitionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid tournament ID' });
    }
    
    const validStatuses = ['upcoming', 'active', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status', 
        validOptions: validStatuses 
      });
    }
    
    const competition = await Competition.findById(id);
    
    if (!competition) {
      return res.status(404).json({ message: 'Tournament not found' });
    }
    
    // If status changed to completed, calculate ranks
    if (status === 'completed' && competition.status !== 'completed') {
      await competition.updateResults();
    } else {
      competition.status = status;
      await competition.save();
    }
    
    res.json({ 
      message: 'Tournament status updated', 
      competitionId: competition._id,
      status: competition.status 
    });
  } catch (error) {
    console.error('Error updating competition status:', error);
    res.status(500).json({ 
      message: 'Error updating tournament status', 
      error: error.message 
    });
  }
};

/**
 * Register a team for a competition
 * New method to support team registration
 */
exports.registerTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { teamId } = req.body;
    
    if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({ message: 'Valid team ID is required' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid competition ID' });
    }
    
    const competition = await Competition.findById(id);
    
    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }
    
    if (!competition.isTeamTournament) {
      return res.status(400).json({ message: 'This competition does not support team participation' });
    }
    
    if (competition.status !== 'upcoming') {
      return res.status(400).json({ message: 'Registration is only available for upcoming competitions' });
    }
    
    // Check if team exists
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    try {
      // Use the model method to register the team
      await competition.registerTeam(teamId);
      
      res.json({
        message: 'Team registered successfully',
        competitionId: competition._id,
        teamId: teamId,
        currentParticipants: competition.currentParticipants
      });
    } catch (error) {
      // Handle specific errors from the model method
      return res.status(400).json({ message: error.message });
    }
  } catch (error) {
    console.error('Error registering team:', error);
    res.status(500).json({ 
      message: 'Error registering team for competition', 
      error: error.message 
    });
  }
};

/**
 * Register an individual for a competition
 * New method to support individual registration
 */
exports.registerIndividual = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Valid user ID is required' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid competition ID' });
    }
    
    const competition = await Competition.findById(id);
    
    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }
    
    if (competition.isTeamTournament) {
      return res.status(400).json({ message: 'This competition requires team participation' });
    }
    
    if (competition.status !== 'upcoming') {
      return res.status(400).json({ message: 'Registration is only available for upcoming competitions' });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    try {
      // Use the model method to register the individual
      await competition.registerIndividual(userId);
      
      res.json({
        message: 'User registered successfully',
        competitionId: competition._id,
        userId: userId,
        currentParticipants: competition.currentParticipants
      });
    } catch (error) {
      // Handle specific errors from the model method
      return res.status(400).json({ message: error.message });
    }
  } catch (error) {
    console.error('Error registering individual:', error);
    res.status(500).json({ 
      message: 'Error registering for competition', 
      error: error.message 
    });
  }
};

/**
 * Update a participant's score
 * New method to support updating scores
 */
exports.updateParticipantScore = async (req, res) => {
  try {
    const { id } = req.params;
    const { participantId, score, completionTime } = req.body;
    const isTeam = req.body.isTeam || false;
    
    if (!participantId || !mongoose.Types.ObjectId.isValid(participantId)) {
      return res.status(400).json({ message: 'Valid participant ID is required' });
    }
    
    if (score === undefined || isNaN(score)) {
      return res.status(400).json({ message: 'Valid score is required' });
    }
    
    if (completionTime !== undefined && isNaN(completionTime)) {
      return res.status(400).json({ message: 'Completion time must be a number (in seconds)' });
    }
    
    const competition = await Competition.findById(id);
    
    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }
    
    if (competition.status !== 'active') {
      return res.status(400).json({ message: 'Scores can only be updated for active competitions' });
    }
    
    if (isTeam) {
      // Update team score
      const teamIndex = competition.participatingTeams.findIndex(
        entry => entry.teamId.toString() === participantId
      );
      
      if (teamIndex === -1) {
        return res.status(404).json({ message: 'Team not found in this competition' });
      }
      
      competition.participatingTeams[teamIndex].score = score;
      
      if (completionTime !== undefined) {
        competition.participatingTeams[teamIndex].completionTime = completionTime;
      }
    } else {
      // Update individual score
      const userIndex = competition.individualParticipants.findIndex(
        entry => entry.userId.toString() === participantId
      );
      
      if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found in this competition' });
      }
      
      competition.individualParticipants[userIndex].score = score;
      
      if (completionTime !== undefined) {
        competition.individualParticipants[userIndex].completionTime = completionTime;
      }
    }
    
    await competition.save();
    
    res.json({
      message: 'Score updated successfully',
      competitionId: competition._id,
      participantId: participantId,
      isTeam: isTeam,
      score: score,
      completionTime: completionTime
    });
  } catch (error) {
    console.error('Error updating score:', error);
    res.status(500).json({ 
      message: 'Error updating participant score', 
      error: error.message 
    });
  }
};




/**
 * Calculate and distribute prizes
 * New method to finalize competition and distribute prizes
 */
exports.distributePrizes = async (req, res) => {
  try {
    const { id } = req.params;
    
    const competition = await Competition.findById(id);
    
    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }
    
    if (competition.status !== 'completed') {
      // First complete the competition by calculating final ranks
      await competition.updateResults();
    }
    
    // Define prize distribution (example: 50% for 1st, 30% for 2nd, 20% for 3rd)
    const prizeDistribution = [0.5, 0.3, 0.2]; // Percentages for top 3 positions
    
    // Only distribute to top 3 or fewer if there are less participants
    const prizeWinners = competition.isTeamTournament 
      ? competition.participatingTeams.slice(0, Math.min(3, competition.participatingTeams.length))
      : competition.individualParticipants.slice(0, Math.min(3, competition.individualParticipants.length));
    
    // Calculate total prize amounts for each winner
    const prizePool = competition.prizePool;
    
    prizeWinners.forEach((winner, index) => {
      winner.prizeWon = prizePool * prizeDistribution[index];
    });
    
    await competition.save();
    
    // Create a response with prize distribution details
    const prizeDetails = prizeWinners.map((winner, index) => ({
      rank: index + 1,
      participantId: competition.isTeamTournament ? winner.teamId : winner.userId,
      isTeam: competition.isTeamTournament,
      prizeAmount: winner.prizeWon,
      percentageOfPool: prizeDistribution[index] * 100
    }));
    
    res.json({
      message: 'Prizes distributed successfully',
      competitionId: competition._id,
      totalPrizePool: prizePool,
      prizeDistribution: prizeDetails
    });
  } catch (error) {
    console.error('Error distributing prizes:', error);
    res.status(500).json({ 
      message: 'Error distributing competition prizes', 
      error: error.message 
    });
  }
};

/**
 * Get competition statistics
 * New method to provide comprehensive competition stats
 */
exports.getCompetitionStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    const competition = await Competition.findById(id)
      .populate('questions');
    
    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }
    
    // Calculate statistics
    const stats = {
      competitionId: competition._id,
      title: competition.title,
      status: competition.status,
      participantCount: competition.currentParticipants,
      questionCount: competition.questions.length,
      financials: {
        entryFee: competition.entryFee,
        totalCollected: competition.totalAmountCollected,
        platformFee: competition.platformFeeAmount,
        prizePool: competition.prizePool
      },
      timing: {
        startTime: competition.startTime,
        endTime: competition.endTime,
        duration: (new Date(competition.endTime) - new Date(competition.startTime)) / (1000 * 60 * 60) // in hours
      }
    };
    
    // Add participant stats
    if (competition.isTeamTournament && competition.participatingTeams.length > 0) {
      stats.topPerformers = competition.participatingTeams
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(team => ({
          teamId: team.teamId,
          score: team.score,
          rank: team.rank || 'Not ranked yet'
        }));
        
      // Calculate average score
      stats.averageScore = competition.participatingTeams.reduce(
        (sum, team) => sum + team.score, 0
      ) / competition.participatingTeams.length;
    } else if (!competition.isTeamTournament && competition.individualParticipants.length > 0) {
      stats.topPerformers = competition.individualParticipants
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(participant => ({
          userId: participant.userId,
          score: participant.score,
          rank: participant.rank || 'Not ranked yet'
        }));
        
      // Calculate average score
      stats.averageScore = competition.individualParticipants.reduce(
        (sum, participant) => sum + participant.score, 0
      ) / competition.individualParticipants.length;
    }
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching competition stats:', error);
    res.status(500).json({ 
      message: 'Error fetching competition statistics', 
      error: error.message 
    });
  }
};
