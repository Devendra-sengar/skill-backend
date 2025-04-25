// // Participation Model
// const mongoose = require('mongoose');
// const ParticipationSchema = new mongoose.Schema({
//     userId: { 
//       type: mongoose.Schema.Types.ObjectId, 
//       ref: 'User',
//       required: true 
//     },     
//     competitionId: { 
//       type: mongoose.Schema.Types.ObjectId, 
//       ref: 'Competition',
//       required: true 
//     },    
//     answers: [{
//       questionId: { 
//         type: mongoose.Schema.Types.ObjectId, 
//         ref: 'Question' 
//       },
//       selectedOption: { type: Number },
//       isCorrect: { type: Boolean },
//       timeSpent: { type: Number } // in seconds
//     }],
//     totalTime: { type: Number }, // in seconds
//     tabSwitches : { type: Number }, // number of times user switched tabs
//     score: { type: Number, default: 0 },
//     rank: { type: Number },
//     startedAt: { type: Date },
//     completedAt: { type: Date },
//     analysis: {
//       strengths: [String],  
//       weaknesses: [String],
//       timeManagement: { type: String },
//       accuracyRate: { type: Number }
//     }
//   });
//   module.exports = mongoose.model('Participation', ParticipationSchema);


const mongoose = require('mongoose');

const ParticipationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },     
  competitionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Competition',
    required: true 
  },    
  answers: [{
    questionId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Question' 
    },
    selectedOption: { type: Number },
    isCorrect: { type: Boolean },
    timeSpent: { type: Number } // in seconds
  }],
  score: { type: Number, default: 0 },
  rank: { type: Number },
  startedAt: { type: Date },
  completedAt: { type: Date },
  analysis: {
    strengths: [String],  
    weaknesses: [String],
    timeManagement: { type: String },
    accuracyRate: { type: Number }
  },
  isResumed : { type: Number , default: null }, // 0 for not resumed, 1 for resumed
  tabSwitches : { type: Number }, // number of times user switched tabs
  totalTime: { type: Number } // in seconds
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual population to automatically get user details



module.exports = mongoose.model('Participation', ParticipationSchema);