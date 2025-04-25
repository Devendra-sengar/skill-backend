 // Team Invitation Model
 const mongoose = require('mongoose');  
 const TeamInvitationSchema = new mongoose.Schema({
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true
    },
    invitedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    sentAt: { type: Date, default: Date.now },
    respondedAt: { type: Date }
  });
  module.exports = mongoose.model('TeamInvitation', TeamInvitationSchema);