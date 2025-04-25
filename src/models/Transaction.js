  // Transaction Model
  const mongoose = require('mongoose'); 
  const TransactionSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'competition_entry', 'competition_winning', 'bet_placement', 'bet_winning', 'premium_subscription'],
      required: true
    },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    referenceId: { type: String }, // Payment gateway reference
    competitionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Competition'
    },
    betId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bet'
    },
    createdAt: { type: Date, default: Date.now },
    completedAt: { type: Date }
  });
  module.exports = mongoose.model('Transaction', TransactionSchema);