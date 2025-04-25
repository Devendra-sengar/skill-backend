
// errorHandler.middleware.js
module.exports = (err, req, res, next) => {
    console.error('Error:', err);
    
    // Handle Multer errors
    if (err.name === 'MulterError') {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          message: 'File too large. Maximum file size is 50MB.'
        });
      }
      return res.status(400).json({
        message: `Upload error: ${err.message}`
      });
    }
    
    // Handle validation errors (Mongoose)
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        message: 'Validation Error',
        errors
      });
    }
    
    // Handle duplicate key errors (MongoDB)
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(400).json({
        message: `Duplicate value for ${field}. Please use a different value.`
      });
    }
    
    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Invalid token'
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Token expired'
      });
    }
    
    // Default error handling
    res.status(err.status || 500).json({
      message: err.message || 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  };