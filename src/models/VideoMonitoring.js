// Video Monitoring Model
const mongoose = require('mongoose');
const VideoMonitoringSchema = new mongoose.Schema({
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
    videoUrl: { type: String, required: true },
    duration: { type: Number }, // in seconds
    status: {
      type: String,
      enum: ['processing', 'available', 'error'],
      default: 'processing'
    },
    monitoredBy: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      viewedAt: { type: Date }
    }],
    recordedAt: { type: Date, default: Date.now }
  });

  module.exports = mongoose.model('VideoMonitoring', VideoMonitoringSchema);