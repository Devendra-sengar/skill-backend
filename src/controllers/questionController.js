// controllers/questionController.js

const Question = require('../models/question');
const Competition = require('../models/Competition');
const mongoose = require('mongoose');

/**
 * Add multiple questions to a tournament using insertMany
 * @route POST /api/competitions/:tournamentId/questions/batch
 */
exports.addBatchQuestions = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { questions } = req.body;

    // Validate input
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide an array of questions' 
      });
    }

    // Validate tournament exists
    const tournament = await Competition.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tournament not found' 
      });
    }

    // Create a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Prepare questions array with tournament data if needed
      const processedQuestions = questions.map(question => {
        // Apply tournament data to question if not provided
        return {
          ...question,
          subject: question.subject || tournament.subject,
          gradeLevel: question.gradeLevel || tournament.gradeLevel || undefined
        };
      });

      // Validate all questions before insertion
      for (const question of processedQuestions) {
        if (!question.text) {
          throw new Error('Question text is required for all questions');
        }

        if (!question.subject) {
          throw new Error('Subject is required for all questions');
        }

        if (!question.options || !Array.isArray(question.options) || question.options.length === 0) {
          throw new Error('Each question must have at least one option');
        }

        // Ensure at least one correct answer
        const hasCorrectAnswer = question.options.some(option => option.isCorrect);
        if (!hasCorrectAnswer) {
          throw new Error('Each question must have at least one correct answer');
        }
      }

      // Insert all questions at once using insertMany
      const insertedQuestions = await Question.insertMany(processedQuestions, { session });
      
      // Get IDs of all inserted questions
      const questionIds = insertedQuestions.map(question => question._id);

      // Add question IDs to tournament
      tournament.questions.push(...questionIds);
      await tournament.save({ session });

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      // Fetch updated tournament with populated questions
      const updatedTournament = await Competition.findById(tournamentId)
        .populate('questions')
        .exec();

      return res.status(201).json({
        success: true,
        message: `${questionIds.length} questions added successfully`,
        data: updatedTournament
      });

    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('Error in addBatchQuestions:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to add questions' 
    });
  }
};

/**
 * Add a single question to a tournament
 * @route POST /api/competitions/:tournamentId/questions/create
 */
exports.addQuestion = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { question } = req.body;

    // Validate input
    if (!question || !question.text) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid question' 
      });
    }

    // Validate tournament exists
    const tournament = await Competition.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tournament not found' 
      });
    }

    // Create new question
    const newQuestion = new Question(question);
    const savedQuestion = await newQuestion.save();
    
    // Add question ID to tournament
    tournament.questions.push(savedQuestion._id);
    await tournament.save();

    // Fetch updated tournament with populated questions
    const updatedTournament = await Competition.findById(tournamentId)
      .populate('questions')
      .exec();

    return res.status(201).json({
      success: true,
      message: 'Question added successfully',
      data: updatedTournament
    });
  } catch (error) {
    console.error('Error in addQuestion:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to add question' 
    });
  }
};

/**
 * Delete a question from a tournament
 * @route DELETE /api/competitions/:tournamentId/questions/:questionId
 */
exports.removeQuestion = async (req, res) => {
  try {
    const { tournamentId, questionId } = req.params;

    // Validate tournament exists
    const tournament = await Competition.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tournament not found' 
      });
    }

    // Remove question ID from tournament
    tournament.questions = tournament.questions.filter(
      id => !id.equals(questionId)
    );
    
    await tournament.save();

    // Delete question from database (optional - uncomment if you want to delete)
    // await Question.findByIdAndDelete(questionId);

    // Get updated tournament
    const updatedTournament = await Competition.findById(tournamentId)
      .populate('questions')
      .exec();

    return res.status(200).json({
      success: true,
      message: 'Question removed from tournament',
      data: updatedTournament
    });
  } catch (error) {
    console.error('Error in removeQuestion:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to remove question' 
    });
  }
};

/**
 * Get all questions for a tournament
 * @route GET /api/competitions/:tournamentId/questions
 */
exports.getTournamentQuestions = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    // Validate tournament exists
    const tournament = await Competition.findById(tournamentId)
      .populate('questions')
      .exec();
      
    if (!tournament) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tournament not found' 
      });
    }

    return res.status(200).json({
      success: true,
      data: tournament.questions
    });
  } catch (error) {
    console.error('Error in getTournamentQuestions:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch questions' 
    });
  }
};