// // Competition Model
// const mongoose = require('mongoose');

// const CompetitionSchema = new mongoose.Schema({
//   title: { type: String, required: true },
//   description: { type: String },
//   subject: { type: String, required: true },
//   gradeLevel: { type: String },
//   tournamentType: { type: String },
//   startTime: { type: Date, required: true },
//   endTime: { type: Date, required: true },
//   entryFee: { type: Number, required: true },
  
//   // Add fields for financial tracking
//   totalAmountCollected: { type: Number, default: 0 },
//   platformFeePercentage: { type: Number, default: 20 }, // 20% platform fee
//   platformFeeAmount: { type: Number, default: 0 },
//   prizePool: { type: Number, required: true },
  
//   maxParticipants: { type: Number },
//   currentParticipants: { type: Number, default: 0 },
//   status: {
//     type: String, 
//     enum: ['upcoming', 'active', 'completed', 'cancelled'],
//     default: 'upcoming'
//   },
//   questions: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Question'
//   }],
//   createdAt: { type: Date, default: Date.now }
// });

// // Pre-save middleware to calculate the platform fee and update the prize pool
// CompetitionSchema.pre('save', function(next) {
//   // Only calculate when participants change (new registrations)
//   if (this.isModified('currentParticipants') || this.isModified('entryFee')) {
//     // Calculate total amount collected
//     this.totalAmountCollected = this.currentParticipants * this.entryFee;
    
//     // Calculate platform fee
//     this.platformFeeAmount = (this.totalAmountCollected * this.platformFeePercentage) / 100;
    
//     // Update prize pool (80% of total collected)
//     this.prizePool = this.totalAmountCollected - this.platformFeeAmount;
//   }
//   next();
// });

// const Competition = mongoose.model('Competition', CompetitionSchema);
// module.exports = Competition;


const mongoose = require('mongoose');

const CompetitionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  subject: { type: String, required: true },
  gradeLevel: { type: String },
  tournamentType: { type: String },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  entryFee: { type: Number, required: true },
  timeDuration: { type: Number, required: true }, // in minutes
  // Financial tracking fields
  totalAmountCollected: { type: Number, default: 0 },
  platformFeePercentage: { type: Number, default: 20 }, // 20% platform fee
  platformFeeAmount: { type: Number, default: 0 },
  prizePool: { type: Number, required: true },
  
  maxParticipants: { type: Number },
  currentParticipants: { type: Number, default: 0 },
  status: {
    type: String, 
    enum: ['upcoming', 'active', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  
  // Questions linked to the competition
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  
  // Track teams participating in the tournament
  participatingTeams: [{
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    joinedAt: { type: Date, default: Date.now },
    score: { type: Number, default: 0 },
    completionTime: { type: Number, default: 0 }, // In seconds
    rank: { type: Number },
    prizeWon: { type: Number, default: 0 }
  }],
  
  // Individual participants (for non-team tournaments)
  individualParticipants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: { type: Date, default: Date.now },
    score: { type: Number, default: 0 },
    completionTime: { type: Number, default: 0 }, // In seconds
    rank: { type: Number },
    prizeWon: { type: Number, default: 0 },
    startedAt:{type:Date},
  }],
  
  // Flag to determine if this is a team tournament or individual
  isTeamTournament: { type: Boolean, default: false },
  
  createdAt: { type: Date, default: Date.now }
});

CompetitionSchema.pre('validate', function (next) {
  if (this.status === 'cancelled') return next(); // don't overwrite if cancelled

  const now = new Date();
  if (now < this.startTime) this.status = 'upcoming';
  else if (now >= this.startTime && now <= this.endTime) this.status = 'active';
  else this.status = 'completed';

  next();
});
// Pre-save middleware to calculate the platform fee and update the prize pool
CompetitionSchema.pre('save', function(next) {
  // Only calculate when participants change (new registrations)
  if (this.isModified('currentParticipants') || this.isModified('entryFee')) {
    // Calculate total amount collected
    this.totalAmountCollected = this.currentParticipants * this.entryFee;
    
    // Calculate platform fee
    this.platformFeeAmount = (this.totalAmountCollected * this.platformFeePercentage) / 100;
    
    // Update prize pool (80% of total collected)
    this.prizePool = this.totalAmountCollected - this.platformFeeAmount;
  }
  
  // Update currentParticipants count based on teams or individuals
  if (this.isTeamTournament) {
    this.currentParticipants = this.participatingTeams.length;
  } else {
    this.currentParticipants = this.individualParticipants.length;
  }
  
  next();
});

// Method to add questions to the tournament
CompetitionSchema.methods.addQuestions = function(questionIds) {
  // Filter out any duplicates
  const newQuestions = questionIds.filter(id => 
    !this.questions.some(existingId => existingId.equals(id))
  );
  
  this.questions.push(...newQuestions);
  return this.save();
};

// Method to register a team for the tournament
CompetitionSchema.methods.registerTeam = function(teamId) {
  // Check if tournament is full
  if (this.maxParticipants && this.participatingTeams.length >= this.maxParticipants) {
    throw new Error('Tournament is full');
  }
  
  // Check if team is already registered
  if (this.participatingTeams.some(entry => entry.teamId.equals(teamId))) {
    throw new Error('Team is already registered');
  }
  
  this.participatingTeams.push({ teamId });
  return this.save();
};

// Method to register an individual for the tournament
CompetitionSchema.methods.registerIndividual = function(userId) {
  // Check if tournament is full
  if (this.maxParticipants && this.individualParticipants.length >= this.maxParticipants) {
    throw new Error('Tournament is full');
  }
  
  // Check if user is already registered
  if (this.individualParticipants.some(entry => entry.userId.equals(userId))) {
    throw new Error('User is already registered');
  }
  
  this.individualParticipants.push({ userId });
  return this.save();
};

// Method to update scores and rankings after tournament completion
CompetitionSchema.methods.updateResults = function() {
  if (this.isTeamTournament) {
    // Sort teams by score (descending) and then by completion time (ascending)
    this.participatingTeams.sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      return a.completionTime - b.completionTime;
    });
    
    // Assign ranks
    this.participatingTeams.forEach((team, index) => {
      team.rank = index + 1;
    });
  } else {
    // Sort individuals by score and completion time
    this.individualParticipants.sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      return a.completionTime - b.completionTime;
    });
    
    // Assign ranks
    this.individualParticipants.forEach((participant, index) => {
      participant.rank = index + 1;
    });
  }
  
  this.status = 'completed';
  return this.save();
};

const Competition = mongoose.model('Competition', CompetitionSchema);
module.exports = Competition;