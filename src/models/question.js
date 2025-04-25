 // Question Model
 const mongoose = require('mongoose');
 const QuestionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    subject: { type: String, required: true },
    gradeLevel: { type: String },
    examType: { type: String },
    options: [{
      text: { type: String, required: true },
      isCorrect: { type: Boolean, required: true }
    }],
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
    topicTags: [String],
    explanation: { type: String }
  });

  module.exports = mongoose.model('Question', QuestionSchema);