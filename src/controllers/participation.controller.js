// // participation.controller.js
// const Participation = require('../models/Participation');
// const Competition = require('../models/Competition');
// const User = require('../models/User');
// const Transaction = require('../models/transaction');
// const Question = require('../models/question');
// const mongoose = require('mongoose');
// const analysisService = require('../services/analysis.service');

// exports.registerForCompetition = async (req, res) => {
//   console.log("hii")
//   const session = await mongoose.startSession();
//   session.startTransaction();
  
//   try {
//     const { id } = req.params;
//     console.log()
//     const userId = req.user._id;

    
//     // Check if competition exists and is open for registration
//     const competition = await Competition.findById(id);
//     if (!competition) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(404).json({ message: 'Competition not found' });
//     }
    
//     if (competition.status !== 'upcoming') {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({ message: 'Registration is closed for this competition' });
//     }
    
//     // Check if user already registered
//     const existingParticipation = await Participation.findOne({ userId, id });
//     if (existingParticipation) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({ message: 'You are already registered for this competition' });
//     }
    
//     // Check if user has sufficient balance
//     const user = await User.findById(userId);
//     if (user.balance < competition.entryFee) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({ message: 'Insufficient balance to register' });
//     }
    
//     // Create participation entry
//     const participation = await Participation.create([{
//       userId,
//       competitionId:id,
//       answers: [],
//       score: 0,
//       startedAt: null
//     }], { session });
    
//     // Deduct entry fee from user balance
//     user.balance -= competition.entryFee;
//     await user.save({ session });
    
//     // Record transaction
//     await Transaction.create([{
//       userId,
//       type: 'competition_entry',
//       amount: -competition.entryFee,
//       status: 'completed',
//       id,
//       completedAt: new Date()
//     }], { session });
    
//     // Update competition participants count
//     competition.currentParticipants += 1;
//     await competition.save({ session });
    
//     await session.commitTransaction();
//     session.endSession();
    
//     res.status(201).json({ 
//       message: 'Successfully registered for competition',
//       participation: participation[0]
//     });
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     console.log(error)
//     res.status(500).json({ message: 'Error registering for competition', error: error.message });
//   }
// };

// exports.getPerformanceAnalysis = async (req, res) => {
//   try {
//     const id = req.params.id;
//     const userId = req.user._id;
    
//     // Check if user participated in this competition
//     const participation = await Participation.findOne({ 
//       userId, 
//       id,
//       completedAt: { $exists: true }  // Ensure competition was completed
//     }).populate('answers.questionId');
    
//     if (!participation) {
//       return res.status(404).json({ message: 'No completed participation found for this competition' });
//     }
    
//     // Get detailed analysis from analysis service
//     const analysis = await analysisService.generateAnalysis(participation);
    
//     res.json(analysis);
//   } catch (error) {
//     res.status(500).json({ message: 'Error generating analysis', error: error.message });
//   }
// };
// participation.controller.js
const Participation = require('../models/Participation');
const Competition = require('../models/Competition');
const User = require('../models/User');
const Transaction = require('../models/transaction');
const Question = require('../models/question');
const mongoose = require('mongoose');
const analysisService = require('../services/analysis.service');


exports.registerForCompetition = async (req, res) => {
  console.log("hii")
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    console.log()
    const userId = req.user._id;

    
    // Check if competition exists and is open for registration
    const competition = await Competition.findById(id);
    if (!competition) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Competition not found' });
    }
    
    if (competition.status !== 'upcoming') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Registration is closed for this competition' });
    }
    
    // Check if user already registered
    const existingParticipation = await Participation.findOne({ userId, competitionId: id });
    if (existingParticipation) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'You are already registered for this competition' });
    }
    
    // Check if user has sufficient balance
    const user = await User.findById(userId);
    if (user.balance < competition.entryFee) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Insufficient balance to register' });
    }
    
    // Create participation entry
    const participation = await Participation.create([{
      userId,
      competitionId: id,
      answers: [],
      score: 0,
      startedAt: null
    }], { session });
    
    // Deduct entry fee from user balance
    user.balance -= competition.entryFee;
    await user.save({ session });
    
    // Record transaction
    await Transaction.create([{
      userId,
      type: 'competition_entry',
      amount: -competition.entryFee,
      status: 'completed',
      competitionId: id,
      completedAt: new Date()
    }], { session });
    
    // Update competition participants count
    competition.currentParticipants += 1;
    await competition.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    res.status(201).json({ 
      message: 'Successfully registered for competition',
      participation: participation[0]
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log(error)
    res.status(500).json({ message: 'Error registering for competition', error: error.message });
  }
};

// Start competition function - sets the startedAt time
exports.startCompetition = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Find the participation
    const participation = await Participation.findOne({ 
      userId, 
      competitionId: id 
    });
    
    if (!participation) {
      return res.status(404).json({ message: 'You are not registered for this competition' });
    }
    
    // Check if the competition is in progress
    const competition = await Competition.findById(id);
    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }
   
    if (competition.status !== 'active') {
      return res.status(400).json({ message: 'Competition is not active yet' });
    }
    
    // Check if the user has already started the competition
    if (participation.startedAt) {
      return res.status(400).json({ message: 'You have already completed this competition' ,data:participation});
    }
    
    // Set the start time
    participation.startedAt = new Date();
    await participation.save();
    
    res.status(200).json({ 
      message: 'Competition started successfully',
      startedAt: participation.startedAt
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error starting competition', error: error.message });
  }
};

// Submit individual answer
exports.submitAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    const { questionId, selectedOption, timeSpent } = req.body;
    const userId = req.user._id;
    
    // Find the participation
    const participation = await Participation.findOne({ 
      userId, 
      competitionId: id 
    });
    
    if (!participation) {
      return res.status(404).json({ message: 'You are not registered for this competition' });
    }
    
    // Check if the competition has been started
    if (!participation.startedAt) {
      return res.status(400).json({ message: 'You need to start the competition first' });
    }
    
    // Check if the competition is already completed
    if (participation.completedAt) {
      return res.status(400).json({ message: 'You have already completed this competition' });
    }
    
    // Find the question
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    // Check if this answer already exists
    const existingAnswerIndex = participation.answers.findIndex(
      answer => answer.questionId.toString() === questionId
    );
    
    // Check if the answer is correct
    const isCorrect = question.correctOption === selectedOption;
    
    // Create answer object
    const answerObj = {
      questionId,
      selectedOption,
      isCorrect,
      timeSpent
    };
    
    // Update or add the answer
    if (existingAnswerIndex !== -1) {
      // If the answer was previously correct and now it's not, adjust score
      if (participation.answers[existingAnswerIndex].isCorrect && !isCorrect) {
        participation.score -= question.points || 1; // Deduct points
      } 
      // If the answer was previously incorrect and now it's correct, add points
      else if (!participation.answers[existingAnswerIndex].isCorrect && isCorrect) {
        participation.score += question.points || 1; // Add points
      }
      
      participation.answers[existingAnswerIndex] = answerObj;
    } else {
      participation.answers.push(answerObj);
      
      // Add points if the answer is correct
      if (isCorrect) {
        participation.score += question.points || 1;
      }
    }
    
    await participation.save();
    
    res.status(200).json({
      message: 'Answer submitted successfully',
      isCorrect,
      currentScore: participation.score
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error submitting answer', error: error.message });
  }
};

// Submit batch of answers
// exports.submitAnswersBatch = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { answers } = req.body; // Array of {questionId, selectedOption, timeSpent}
//     const userId = req.user._id;
    
//     // Validate input
//     if (!Array.isArray(answers) || answers.length === 0) {
//       return res.status(400).json({ message: 'Invalid answers format' });
//     }
      
//     // Find the participation
//     const participation = await Participation.findOne({ 
//       userId, 
//       competitionId: id 
//     });
//     console.log("participation ",participation)
//     if (!participation) {
//       return res.status(404).json({ message: 'You are not registered for this competition' });
//     }
    
//     // Check if the competition has been started
//     if (!participation.startedAt) {
//       return res.status(400).json({ message: 'You need to start the competition first' });
//     }
    
//     // Check if the competition is already completed
//     if (participation.completedAt) {
//       return res.status(400).json({ message: 'You have already completed this competition' });
//     }
    
//     // Get all question IDs from answers
//     const questionIds = answers.map(answer => answer.questionId);
    
//     // Fetch all questions at once for efficiency
//     const questions = await Question.find({ _id: { $in: questionIds } });
    
//     // Create a map for quick lookup
//     const questionMap = {};
//     questions.forEach(question => {
//       questionMap[question._id.toString()] = question;
//     });
    
//     // Create a map of existing answers for quick lookup
//     const existingAnswersMap = {};
//     participation.answers.forEach((answer, index) => {
//       existingAnswersMap[answer.questionId.toString()] = index;
//     });
    
//     // Process each answer
//     let scoreAdjustment = 0;
//     const processedAnswers = [];
    
//     answers.forEach(answer => {
//       const question = questionMap[answer.questionId.toString()];
//       if (!question) {
//         return; // Skip if question not found
//       }
      
//       const isCorrect = question.correctOption === answer.selectedOption;
//       const points = question.points || 1;
//       const existingIndex = existingAnswersMap[answer.questionId.toString()];
      
//       // Prepare answer object
//       const answerObj = {
//         questionId: answer.questionId,
//         selectedOption: answer.selectedOption,
//         isCorrect,
//         timeSpent: answer.timeSpent
//       };
      
//       if (existingIndex !== undefined) {
//         // Update existing answer
//         const existingAnswer = participation.answers[existingIndex];
        
//         // Update score if correctness changed
//         if (existingAnswer.isCorrect && !isCorrect) {
//           scoreAdjustment -= points; // Was correct, now incorrect
//         } else if (!existingAnswer.isCorrect && isCorrect) {
//           scoreAdjustment += points; // Was incorrect, now correct
//         }
        
//         participation.answers[existingIndex] = answerObj;
//       } else {
//         // Add new answer
//         participation.answers.push(answerObj);
        
//         // Add to score if correct
//         if (isCorrect) {
//           scoreAdjustment += points;
//         }
//       }
      
//       processedAnswers.push(answerObj);
//     });
    
//     // Update the score
//     participation.score += scoreAdjustment;
    
//     await participation.save();
    
//     res.status(200).json({
//       message: 'Answers batch submitted successfully',
//       processedCount: processedAnswers.length,
//       scoreAdjustment,
//       currentScore: participation.score
//     });
    
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Error submitting answers batch', error: error.message });
//   }
// };
exports.submitAnswersBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers,totalTime,tabSwitches,isResumed} = req.body; // Array of {questionId, selectedOption, timeSpent}
    const userId = req.user._id;
    console.log(req.body)
    
    // Validate input
    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: 'Invalid answers format' });
    }
      
    // Find the participation
    const participation = await Participation.findOne({ 
      userId, 
      competitionId: id 
    });
    
    if (!participation) {
      return res.status(404).json({ message: 'You are not registered for this competition' });
    }
    // Check if the competition is already completed
    if (participation.completedAt) {
      return res.status(400).json({ message: 'You have already completed this competition' });
    }
    
    // Check if the competition has been started
    if (!participation.startedAt) {
      return res.status(400).json({ message: 'You need to start the competition first' });
    }
    
    
    // Get all question IDs from answers
    const questionIds = answers.map(answer => answer.questionId);
    
    // Fetch all questions at once for efficiency
    const questions = await Question.find({ _id: { $in: questionIds } });
    
    // Create a map for quick lookup
    const questionMap = {};
    questions.forEach(question => {
      questionMap[question._id.toString()] = question;
    });
    
    // Create a map of existing answers for quick lookup
    const existingAnswersMap = {};
    participation.answers.forEach((answer, index) => {
      existingAnswersMap[answer.questionId.toString()] = index;
    });
    
    // Process each answer
    let scoreAdjustment = 0;
    const processedAnswers = [];
    
    answers.forEach(answer => {
      const question = questionMap[answer.questionId.toString()];
      if (!question) {
        return; // Skip if question not found
      }
      
      // Check if the answer is correct by comparing with the options array
      // where selectedOption is the index of the option chosen
      const selectedOptionIndex = answer.selectedOption;
      const isCorrect = question.options && 
                       question.options[selectedOptionIndex] && 
                       question.options[selectedOptionIndex].isCorrect === true;
      
      const points = question.points || 1;
      const existingIndex = existingAnswersMap[answer.questionId.toString()];
      
      // Prepare answer object
      const answerObj = {
        questionId: answer.questionId,
        selectedOption: answer.selectedOption,
        isCorrect,
        timeSpent: answer.timeSpent
      };
      
      if (existingIndex !== undefined) {
        // Update existing answer
        const existingAnswer = participation.answers[existingIndex];
        
        // Update score if correctness changed
        if (existingAnswer.isCorrect && !isCorrect) {
          scoreAdjustment -= points; // Was correct, now incorrect
        } else if (!existingAnswer.isCorrect && isCorrect) {
          scoreAdjustment += points; // Was incorrect, now correct
        }
        
        participation.answers[existingIndex] = answerObj;
      } else {
        // Add new answer
        participation.answers.push(answerObj);
        
        // Add to score if correct
        if (isCorrect) {
          scoreAdjustment += points;
        }
      }

      
      processedAnswers.push(answerObj);
    });
    
    // Update the score
    participation.score += scoreAdjustment;
    participation.totalTime = totalTime; // Update total time spent
    participation.tabSwitches = tabSwitches; // Update tab switches
    if(isResumed){
      participation.isResumed = isResumed; // Update if the quiz was resumed
    }
    await participation.save();
    
    res.status(200).json({
      message: 'Answers batch submitted successfully',
      processedCount: processedAnswers.length,
      scoreAdjustment,
      currentScore: participation.score
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error submitting answers batch', error: error.message });
  }
};

// Complete competition
exports.completeCompetition = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Find the participation
    const participation = await Participation.findOne({ 
      userId, 
      competitionId: id 
    });
    
    if (!participation) {
      return res.status(404).json({ message: 'You are not registered for this competition' });
    }
    
    // Check if the competition has been started
    if (!participation.startedAt) {
      return res.status(400).json({ message: 'You need to start the competition first' });
    }
    
    // Check if the competition is already completed
    if (participation.completedAt) {
      return res.status(400).json({ message: 'You have already completed this competition' });
    }
    
    // Mark as completed
    participation.completedAt = new Date();
    
    // Calculate basic analysis
    if (participation.answers.length > 0) {
      const totalAnswers = participation.answers.length;
      const correctAnswers = participation.answers.filter(a => a.isCorrect).length;
      const accuracyRate = (correctAnswers / totalAnswers) * 100;
      
      participation.analysis = {
        accuracyRate,
        timeManagement: 'Pending detailed analysis',
        strengths: [],
        weaknesses: []
      };
    }
    
    await participation.save();
    
    res.status(200).json({
      message: 'Competition completed successfully',
      score: participation.score,
      completedAt: participation.completedAt
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error completing competition', error: error.message });
  }
};

exports.getPerformanceAnalysis = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user._id;
    
    // Check if user participated in this competition
    const participation = await Participation.findOne({ 
      userId, 
      competitionId: id,
      completedAt: { $exists: true }  // Ensure competition was completed
    }).populate('answers.questionId');
    
    if (!participation) {
      return res.status(404).json({ message: 'No completed participation found for this competition' });
    }
    
    // Get detailed analysis from analysis service
    const analysis = await analysisService.generateAnalysis(participation);
    
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ message: 'Error generating analysis', error: error.message });
  }
};

exports.getParticipantStatus = async (req,res)=>{
  try {
    const { id } = req.params;
    const { _id:userId } = req.user;
    
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
    
    let status = null;
    
    if (competition.isTeamTournament) {
      const team = competition.participatingTeams.find(team => team.teamId.toString() === userId);
      if (team) {
        status = team.status;
      } else {
        return res.status(404).json({ message: 'User not found in this competition' });
      }
    } else {
      const participant = competition.individualParticipants.find(participant => participant.userId.equals(userId));
      if (participant) {
        status = participant.status;
      } else {
        return res.status(404).json({ message: 'User not found in this competition' });
      }
    }
    
    res.json({
      message: 'Participant status retrieved successfully',
      competitionId: competition._id,
      userId: userId,
      status: status,
      
    });
  } catch (error) {
    console.error('Error fetching participant status:', error);
    res.status(500).json({ 
      message: 'Error fetching participant status', 
      error: error.message 
    });
  }
}




// // Controller to get the leaderboard
// exports.getLeaderboard = async (req, res) => {
//   try {
//     const { competitionId } = req.params;

//     // Validate competitionId
//     if (!mongoose.Types.ObjectId.isValid(competitionId)) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Invalid competition ID format' 
//       });
//     }

//     // First, update the ranks for all participants in this competition
//     await calculateAndUpdateRanks(competitionId);

//     // Then fetch the leaderboard with the updated ranks
//     const leaderboard = await Participation.find({ 
//       competitionId,
//       completedAt: { $ne: null } // Only include participants who have completed
//     })
//     .sort({ rank: 1 }) // Sort by rank (ascending)
//     .populate('userId', 'username email profileImage') // Populate basic user info
//     .select('userId score rank totalTime tabSwitches completedAt');

//     return res.status(200).json({
//       success: true,
//       data: leaderboard
//     });
//   } catch (error) {
//     console.error('Error fetching leaderboard:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to fetch leaderboard',
//       error: error.message
//     });
//   } 
// };

// // Helper function to calculate and update all ranks for a competition
// const calculateAndUpdateRanks = async (competitionId) => {
//   try {
//     // Get all completed participations for this competition
//     const participations = await Participation.find({
//       competitionId,
//       completedAt: { $ne: null }
//     }).exec();

//     // First, handle defaulters (those with tab switches)
//     // Then sort the remaining by score (desc) and totalTime (asc)
//     const defaulters = [];
//     const validParticipants = [];

//     participations.forEach(participant => {
//       if (participant.tabSwitches && participant.tabSwitches > 0) {
//         // Mark as defaulter
//         participant.rank = 0;
//         defaulters.push(participant);
//       } else {
//         validParticipants.push(participant);
//       }
//     });

//     // Sort valid participants by score (higher better) and totalTime (lower better)
//     validParticipants.sort((a, b) => {
//       if (b.score !== a.score) {
//         return b.score - a.score; // Higher score comes first
//       }
//       return a.totalTime - b.totalTime; // Lower time comes first if scores are equal
//     });

//     // Assign ranks to valid participants
//     let currentRank = 1;
//     let previousScore = null;
//     let previousTime = null;

//     for (let i = 0; i < validParticipants.length; i++) {
//       const participant = validParticipants[i];
      
//       // If this is a new score/time combination, increase the rank
//       if (i > 0 && (participant.score !== previousScore || participant.totalTime !== previousTime)) {
//         currentRank = i + 1; // Rank is position (1-based index)
//       }
      
//       participant.rank = currentRank;
//       previousScore = participant.score;
//       previousTime = participant.totalTime;
//     }

//     // Save all updated participants (both defaulters and valid)
//     const allParticipants = [...validParticipants, ...defaulters];
//     const savePromises = allParticipants.map(participant => participant.save());
//     await Promise.all(savePromises);

//     return true;
//   } catch (error) {
//     console.error('Error calculating ranks:', error);
//     throw error;
//   }
// };

exports.getLeaderboard = async (req, res) => {
  try {
    const { competitionId } = req.params;

    // Validate competitionId
    if (!mongoose.Types.ObjectId.isValid(competitionId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid competition ID format' 
      });
    }

    // First, update the ranks for all participants in this competition
    await calculateAndUpdateRanks(competitionId);

    // Then fetch the leaderboard with the updated ranks
    const leaderboard = await Participation.find({ 
      competitionId,
      completedAt: { $ne: null } // Only include participants who have completed
    })
    .sort({ rank: 1 }) // Sort by rank (ascending)
    .populate('userId', 'username email profileImage tabSwitches totalTime') // Populate basic user info
    .select('userId score rank totalTime tabSwitches completedAt');

    return res.status(200).json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard',
      error: error.message
    });
  } 
};

// Helper function to calculate and update all ranks for a competition
const calculateAndUpdateRanks = async (competitionId) => {
  try {
    // Get all completed participations for this competition
    const participations = await Participation.find({
      competitionId,
      completedAt: { $ne: null }
    }).exec();

    // Separate participants into valid and defaulters (those with tab switches)
    const defaulters = [];
    const validParticipants = [];

    participations.forEach(participant => {
      if (participant.tabSwitches && participant.tabSwitches > 0) {
        defaulters.push(participant);
      } else {
        validParticipants.push(participant);
      }
    });

    // Sort valid participants by score (higher better) and totalTime (lower better)
    validParticipants.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score; // Higher score comes first
      }
      return a.totalTime - b.totalTime; // Lower time comes first if scores are equal
    });

    // Sort defaulters by tabSwitches (fewer switches ranked higher)
    defaulters.sort((a, b) => {
      return a.tabSwitches - b.tabSwitches;
    });

    // Assign ranks to valid participants
    let currentRank = 1;
    let previousScore = null;
    let previousTime = null;

    for (let i = 0; i < validParticipants.length; i++) {
      const participant = validParticipants[i];
      
      // If this is a new score/time combination, increase the rank
      if (i > 0 && (participant.score !== previousScore || participant.totalTime !== previousTime)) {
        currentRank = i + 1; // Rank is position (1-based index)
      }
      
      participant.rank = currentRank;
      previousScore = participant.score;
      previousTime = participant.totalTime;
    }

    // Assign ranks to defaulters, starting after the last valid participant
    let startingDefaulterRank = validParticipants.length > 0 ? 
                               validParticipants.length + 1 : 
                               1;
    
    let previousSwitches = null;
    
    for (let i = 0; i < defaulters.length; i++) {
      const defaulter = defaulters[i];
      
      // If this is a new switches count, increase the rank
      if (i > 0 && defaulter.tabSwitches !== previousSwitches) {
        startingDefaulterRank = validParticipants.length + i + 1;
      }
      
      defaulter.rank = startingDefaulterRank;
      previousSwitches = defaulter.tabSwitches;
    }

    // Save all updated participants (both valid and defaulters)
    const allParticipants = [...validParticipants, ...defaulters];
    const savePromises = allParticipants.map(participant => participant.save());
    await Promise.all(savePromises);

    return true;
  } catch (error) {
    console.error('Error calculating ranks:', error);
    throw error;
  }
};

exports.getParticipant = async(req,res)=>{
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Find the participation
    const participation = await Participation.findOne({ 
      userId, 
      competitionId: id 
    });
    
    if (!participation) {
      return res.status(404).json({ message: 'You are not registered for this competition' });
    }
    
    res.status(200).json({
      message: 'Participant retrieved successfully',
      participation
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving participant', error: error.message });
  }
}




