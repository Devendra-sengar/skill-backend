const { FRONTEND_URL } = require('./auth');

// config/environment.js
require('dotenv').config();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  FRONTEND_URL:'https://ugskill-frontend.vercel.app',
  // Application info
  APP_NAME: 'Relationship Quiz App',
  APP_VERSION: '1.0.0',
  
  // Database
  DB_URI: process.env.DB_URI || 'mongodb://localhost:27017/relationship-quiz-app',
  
  // Email configuration
  EMAIL: {
    SERVICE: 'gmail',
    HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
    PORT: process.env.EMAIL_PORT || 587,
    USERNAME: process.env.EMAIL_USERNAME || "harshkhandelwal597@gmail.com",
    PASSWORD: process.env.EMAIL_PASSWORD || "dwepporbvkwdeany",
    FROM_ADDRESS: process.env.EMAIL_FROM || 'harshkhandelwal597@gmail.com'
  },
  
  // Payment gateway configurations
  PAYMENT: {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET
  },
  

  
  // Subscription plans
  SUBSCRIPTION_PLANS: {
    FREE: 'free',
    PREMIUM: 'premium'
  },
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // CORS settings
  CORS_ORIGINS: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000']
};