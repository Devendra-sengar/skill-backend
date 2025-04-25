// upload.middleware.js
const multer = require('multer');
const path = require('path');

// Configure storage for different types of uploads
const storage = multer.memoryStorage();

// File filter - restrict file types
const fileFilter = (req, file, cb) => {
  // For profile pictures - accept only images
  if (file.fieldname === 'profilePicture') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for profile pictures'), false);
    }
  }
  // For videos - accept only video files
  else if (file.fieldname === 'video') {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'), false);
    }
  }
  // For study materials - accept common document types
  else if (file.fieldname === 'studyMaterial') {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, Word, and Excel files are allowed for study materials'), false);
    }
  } else {
    cb(null, true);
  }
};

// Create multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB limit
  }
});

module.exports = upload;