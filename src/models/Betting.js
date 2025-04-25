// Betting Model
const mongoose = require('mongoose');
// Betting Model
const BetSchema = new mongoose.Schema({
    bettorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    competitionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Competition',
      required: true
    },
    betType: {
      type: String,
      enum: ['self_challenge', 'player_bet', 'team_backing', 'performance_prediction'],
      required: true
    },
    targetId: { // User ID or Team ID being bet on
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    amount: { type: Number, required: true },
    predictedOutcome: { type: String }, // e.g., "top 10", "winner", etc.
    actualOutcome: { type: String },
    status: {
      type: String,
      enum: ['placed', 'won', 'lost', 'cancelled'],
      default: 'placed'
    },
    odds: { type: Number },
    potentialWinnings: { type: Number },
    actualWinnings: { type: Number },
    createdAt: { type: Date, default: Date.now },
    settledAt: { type: Date }
  });
  module.exports = mongoose.model('Bet', BetSchema);