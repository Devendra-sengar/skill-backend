

// video.service.js
const aws = require('aws-sdk');
const VideoMonitoring = require('../models/videoMonitoring.model');

// Configure AWS
aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new aws.S3();

exports.uploadVideo = async (file, userId, competitionId) => {
  try {
    // Generate a unique file name
    const fileName = `${userId}-${competitionId}-${Date.now()}.mp4`;
    
    // Upload to S3
    const uploadResult = await s3.upload({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `videos/${fileName}`,
      Body: file.buffer,
      ContentType: file.mimetype
    }).promise();
    
    // Create video monitoring record
    const videoRecord = await VideoMonitoring.create({
      userId,
      competitionId,
      videoUrl: uploadResult.Location,
      status: 'processing'
    });
    
    // In a real app, you might trigger a video processing function here
    // For now, we'll simulate by setting a timeout to update status
    setTimeout(async () => {
      videoRecord.status = 'available';
      await videoRecord.save();
    }, 10000); // 10 seconds delay to simulate processing
    
    return videoRecord;
  } catch (error) {
    console.error('Video upload error:', error);
    throw error;
  }
};

exports.getVideoForMonitoring = async (videoId, userId) => {
  try {
    const video = await VideoMonitoring.findById(videoId);
    
    if (!video) {
      throw new Error('Video not found');
    }
    
    if (video.status !== 'available') {
      throw new Error('Video is not available for viewing');
    }
    
    // Record that this user viewed the video
    if (!video.monitoredBy.some(monitor => monitor.userId.toString() === userId.toString())) {
      video.monitoredBy.push({
        userId,
        viewedAt: new Date()
      });
      await video.save();
    }
    
    return video;
  } catch (error) {
    console.error('Get video error:', error);
    throw error;
  }
};