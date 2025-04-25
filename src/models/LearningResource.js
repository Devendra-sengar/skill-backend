 const mongoose = require('mongoose');
  const LearningResourceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ['study_material', 'practice_question', 'video_lecture', 'ai_assistant'],
      required: true
    },
    subject: { type: String, required: true },
    gradeLevel: { type: String },
    examType: { type: String },
    content: { type: String }, // Text content or video URL
    fileUrl: { type: String }, // For downloadable resources
    topicTags: [String],
    difficulty: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });

module.exports = mongoose.model('LearningResource', LearningResourceSchema);   