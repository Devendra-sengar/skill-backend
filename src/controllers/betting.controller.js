// betting.controller.js
const Bet = require('../models/bet.model');
const User = require('../models/user.model');
const Competition = require('../models/competition.model');
const Participation = require('../models/participation.model');
const Transaction = require('../models/transaction.model');
const Team = require('../models/team.model');
const mongoose = require('mongoose');

exports.placeBetOnPlayer = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { competitionId, targetUserId, amount, predictedOutcome } = req.body;
    const bettorId = req.user._id;
    
    // Validate competition exists and is upcoming or active
    const competition = await Competition.findById(competitionId);
    if (!competition || competition.status === 'completed') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Cannot place bet on this competition' });
    }
    
    // Validate target user exists and is participating in competition
    const targetParticipation = await Participation.findOne({ userId: targetUserId, competitionId });
    if (!targetParticipation) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Target player is not participating in this competition' });
    }
    
    // Check if user has sufficient balance
    const user = await User.findById(bettorId);
    if (user.balance < amount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Insufficient balance to place bet' });
    }
    
    // Calculate odds based on player's history and competition
    const odds = await calculatePlayerOdds(targetUserId, competitionId, predictedOutcome);
    const potentialWinnings = amount * odds;
    
    // Create bet
    const bet = await Bet.create([{
      bettorId,
      competitionId,
      betType: 'player_bet',
      targetId: targetUserId,
      amount,
      predictedOutcome,
      status: 'placed',
      odds,
      potentialWinnings
    }], { session });
    
    // Deduct amount from user balance
    user.balance -= amount;
    await user.save({ session });
    
    // Record transaction
    await Transaction.create([{
      userId: bettorId,
      type: 'bet_placement',
      amount: -amount,
      status: 'completed',
      competitionId,
      betId: bet[0]._id,
      completedAt: new Date()
    }], { session });
    
    await session.commitTransaction();
    session.endSession();
    
    res.status(201).json({
      message: 'Bet placed successfully',
      bet: bet[0]
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: 'Error placing bet', error: error.message });
  }
};

// Helper function to calculate odds - implementation would depend on your business logic
async function calculatePlayerOdds(targetUserId, competitionId, predictedOutcome) {
  // This would be a complex function based on:
  // - Player's past performance
  // - Competition difficulty
  // - Number of participants
  // - Predicted outcome specifics
  // For example purposes, returning a random value between 1.2 and 3.0
  return 1.2 + Math.random() * 1.8;
}