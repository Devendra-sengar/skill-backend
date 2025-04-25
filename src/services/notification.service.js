

// notification.service.js
const User = require('../models/user.model');
const TeamInvitation = require('../models/teamInvitation.model');
const socketService = require('./socket.service');

exports.sendTeamInvitation = async (teamId, teamName, invitedUserId, inviterId) => {
  try {
    // Create invitation in the database
    const invitation = await TeamInvitation.create({
      teamId,
      invitedUserId,
      status: 'pending'
    });
    
    // Get inviter details
    const inviter = await User.findById(inviterId);
    
    // Prepare notification payload
    const notification = {
      type: 'team_invitation',
      title: 'New Team Invitation',
      message: `${inviter.username} has invited you to join their team: ${teamName}`,
      invitationId: invitation._id,
      teamId,
      timestamp: new Date()
    };
    
    // Send real-time notification if user is online
    socketService.sendNotification(invitedUserId, notification);
    
    // In a real app, you would also send an email/push notification here
    
    return invitation;
  } catch (error) {
    console.error('Notification service error:', error);
    throw error;
  }
};