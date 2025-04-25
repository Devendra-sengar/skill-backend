// services/emailService.js
const nodemailer = require('nodemailer');
const config = require('../config/environment');
// const logger = require('../utils/logger');

/**
 * Create email transporter based on environment
 * @returns {object} Configured nodemailer transporter
 */
const createTransporter = () => {
  try {
    if (process.env.NODE_ENV === 'production') {
      // Production email service (e.g., SendGrid, AWS SES)
      return nodemailer.createTransport({
        service: config.EMAIL.SERVICE,
        auth: {
          user: config.EMAIL.USERNAME,
          pass: config.EMAIL.PASSWORD
        }
      });
    } else {
      // Development email service (e.g., mailtrap.io)
      return nodemailer.createTransport({
        host: config.EMAIL.HOST,
        port: config.EMAIL.PORT,
        auth: {
          user: config.EMAIL.USERNAME,
          pass: config.EMAIL.PASSWORD
        }
      });
    }
  } catch (error) {
    logger.error('Error creating email transporter:', error);
    throw new Error(`Failed to create email transporter: ${error.message}`);
  }
};

// Store transporter instance to reuse connection
let cachedTransporter = null;

/**
 * Get or create transporter with connection pooling
 * @returns {object} Configured nodemailer transporter
 */
const getTransporter = () => {
  if (!cachedTransporter) {
    cachedTransporter = createTransporter();
  }
  return cachedTransporter;
};

/**
 * Send email helper function
 * @param {object} options - Email options (email, subject, html)
 * @returns {Promise<boolean>} - Returns true if email sent successfully
 */
const sendEmail = async (options) => {
  try {
    if (!options.email) {
      throw new Error('Recipient email is required');
    }
    
    const transporter = getTransporter();
    
    const mailOptions = {
      from: `${config.APP_NAME} <${config.EMAIL.FROM_ADDRESS}>`,
      to: options.email,
      subject: options.subject || `Message from ${config.APP_NAME}`,
      html: options.html
    };
    
    // Add CC if provided
    if (options.cc) {
      mailOptions.cc = options.cc;
    }
    
    // Add BCC if provided
    if (options.bcc) {
      mailOptions.bcc = options.bcc;
    }
    
    // Add attachments if provided
    if (options.attachments) {
      mailOptions.attachments = options.attachments;
    }
    
    // Add plain text alternative for better accessibility
    if (options.text) {
      mailOptions.text = options.text;
    } else {
      // Create basic text version from HTML
      mailOptions.text = options.html.replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${options.email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Email send error:', error);
    throw new Error(`Error sending email: ${error.message}`);
  }
};

/**
 * Creates a responsive email template wrapper
 * @param {object} content - The email content and settings
 * @returns {string} - Complete HTML email with styling
 */
const createEmailTemplate = (content) => {
  const {
    title,
    preheader = '',
    greeting,
    bodyContent,
    ctaButton = null,
    footerText =` © ${new Date().getFullYear()} ${config.APP_NAME}. All rights reserved.`,
    accentColor = '#4361ee'
  } = content;

  // Optional CTA button
  const ctaButtonHtml = ctaButton ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${ctaButton.url}" 
         style="background-color: ${accentColor}; 
                color: white; 
                padding: 12px 24px; 
                text-decoration: none; 
                border-radius: 6px; 
                font-weight: bold;
                display: inline-block;">
        ${ctaButton.text}
      </a>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="ie=edge">
      <title>${title}</title>
      <meta name="description" content="${preheader}">
      <!--[if mso]>
      <style type="text/css">
        .fallback-font {
          font-family: Arial, sans-serif;
        }
      </style>
      <![endif]-->
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #333333; background-color: #f4f7fa;">
      <!-- Preheader text (shows in inbox preview) -->
      <div style="display: none; max-height: 0; overflow: hidden;">
        ${preheader}
      </div>
      
      <!-- Email Container -->
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08); border-radius: 8px; overflow: hidden;">
        
        <!-- Header -->
        <div style="background-color: ${accentColor}; padding: 30px 0; text-align: center;">
          <h1 style="color: white; margin: 0; padding: 0 20px; font-size: 24px;">${title}</h1>
        </div>
        
        <!-- Email Body -->
        <div style="padding: 30px 40px; line-height: 1.6;">
          <p style="font-size: 16px; margin-top: 0;"><strong>${greeting}</strong></p>
          
          ${bodyContent}
          
          ${ctaButtonHtml}
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f5f7fa; text-align: center; padding: 20px; color: #666666; font-size: 14px;">
          <p style="margin: 5px 0;">If you have any questions, please contact our support team</p>
          <p style="margin: 5px 0;">${footerText}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Send verification email to user
 * @param {object} options - User details and verification URL
 * @returns {Promise<object>} - Returns success status and messageId if email sent successfully
 */
exports.sendVerificationEmail = async (options) => {
  if (!options.email || !options.verificationURL || !options.firstName) {
    throw new Error('Missing required parameters for verification email');
  }

  const emailContent = createEmailTemplate({
    title:` Verify Your ${config.APP_NAME} Account`,
    preheader: 'Please verify your email address to complete your registration',
    greeting: `Hi ${options.firstName},`,
    bodyContent: `
      <p>Thank you for signing up. Please verify your email address to get started using ${config.APP_NAME}.</p>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't sign up for ${config.APP_NAME}, please ignore this email.</p>
    `,
    ctaButton: {
      text: 'Verify Email',
      url: options.verificationURL
    }
  });
  
  return sendEmail({
    email: options.email,
    subject: options.subject || `Verify your email for ${config.APP_NAME}`,
    html: emailContent
  });
};

/**
 * Send password reset email
 * @param {object} options - User details and reset URL
 * @returns {Promise<object>} - Returns success status and messageId if email sent successfully
 */
exports.sendPasswordResetEmail = async (options) => {
  if (!options.email || !options.resetURL || !options.firstName) {
    throw new Error('Missing required parameters for password reset email');
  }

  const emailContent = createEmailTemplate({
    title: 'Reset Your Password',
    preheader: 'Follow these instructions to reset your password',
    greeting:` Hi ${options.firstName},`,
    bodyContent: `
      <p>You recently requested to reset your password for your ${config.APP_NAME} account.</p>
      <p>Click the button below to reset it. This link will expire in ${options.validityPeriod || '1 hour'}.</p>
      <p>If you didn't request a password reset, please ignore this email or contact support if you're concerned.</p>
    `,
    ctaButton: {
      text: 'Reset Password',
      url: options.resetURL
    },
    accentColor: '#2196F3'
  });
  
  return sendEmail({
    email: options.email,
    subject: options.subject || `Reset your password for ${config.APP_NAME}`,
    html: emailContent
  });
};

/**
 * Send welcome email after successful registration/verification
 * @param {object} options - User details
 * @returns {Promise<object>} - Returns success status and messageId if email sent successfully
 */
exports.sendWelcomeEmail = async (options) => {
  if (!options.email || !options.firstName) {
    throw new Error('Missing required parameters for welcome email');
  }

  const loginURL = options.loginURL || `${config.FRONTEND_URL}/login`;

  const features = options.features || [
    'Take relationship quizzes to better understand your relationship dynamics',
    'Get personalized feedback tailored to your unique situation',
    'Track your relationship growth over time'
  ];

  const featuresHtml = features.map(feature => 
   ` <li style="margin-bottom: 8px;">${feature}</li>`
  ).join('');

  const emailContent = createEmailTemplate({
    title: `Welcome to ${config.APP_NAME}!`,
    preheader: `Thank you for joining ${config.APP_NAME}. Get started with your account.`,
    greeting:` Hi ${options.firstName}`,
    bodyContent: `
      <p>Thank you for joining our community. We're excited to have you on board!</p>
      <p>With ${config.APP_NAME}, you can:</p>
      <ul style="padding-left: 20px; margin-bottom: 20px;">
        ${featuresHtml}
      </ul>
      <p>To get started, simply log in to your account and take your first quiz.</p>
    `,
    ctaButton: {
      text: 'Get Started',
      url: loginURL
    },
    accentColor: '#4CAF50'
  });
  
  return sendEmail({
    email: options.email,
    subject: options.subject || `Welcome to ${config.APP_NAME}!`,
    html: emailContent
  });
};

/**
 * Send partner invitation email
 * @param {object} options - Invitation details
 * @returns {Promise<object>} - Returns success status and messageId if email sent successfully
 */
exports.sendPartnerInvitationEmail = async (options) => {
  if (!options.recipientEmail || !options.invitationURL || !options.senderName) {
    throw new Error('Missing required parameters for partner invitation email');
  }

  const emailContent = createEmailTemplate({
    title: 'You\'ve Been Invited!',
    preheader:` ${options.senderName} has invited you to take a relationship quiz`,
    greeting: 'Hi there,',
    bodyContent: `
      <p>${options.senderName} has invited you to take a relationship quiz on ${config.APP_NAME}.</p>
      <p>By taking this quiz together, you can gain valuable insights about your relationship dynamics and compatibility.</p>
      <p>This invitation will expire in 7 days.</p>
    `,
    ctaButton: {
      text: 'Accept Invitation',
      url: options.invitationURL
    },
    accentColor: '#FF4081'
  });
  
  return sendEmail({
    email: options.recipientEmail,
    subject: options.subject || `${options.senderName} has invited you to take a relationship quiz`,
    html: emailContent
  });
};

/**
 * Send quiz results email
 * @param {object} options - Quiz results details
 * @returns {Promise<object>} - Returns success status and messageId if email sent successfully
 */
exports.sendQuizResultsEmail = async (options) => {
  if (!options.email || !options.firstName || !options.quizTitle || !options.resultsURL) {
    throw new Error('Missing required parameters for quiz results email');
  }

  const emailContent = createEmailTemplate({
    title: 'Your Quiz Results',
    preheader: `Your results for the ${options.quizTitle} quiz are ready`,
    greeting:` Hi ${options.firstName},`,
    bodyContent: `
      <p>Thank you for completing the "${options.quizTitle}" quiz. Here's a summary of your results:</p>
      
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9C27B0;">
        <h3 style="margin-top: 0; color: #9C27B0;">Your Score: ${options.score}%</h3>
        <p style="margin-bottom: 0;">${options.summary}</p>
      </div>
      
      <p>To view your detailed results and personalized recommendations, click the button below:</p>
    `,
    ctaButton: {
      text: 'View Full Results',
      url: options.resultsURL
    },
    accentColor: '#9C27B0'
  });
  
  return sendEmail({
    email: options.email,
    subject: options.subject ||` Your Results: ${options.quizTitle}`,
    html: emailContent
  });
};

/**
 * Send subscription confirmation email
 * @param {object} options - Subscription details
 * @returns {Promise<object>} - Returns success status and messageId if email sent successfully
 */
exports.sendSubscriptionConfirmationEmail = async (options) => {
  if (!options.email || !options.firstName || !options.planName) {
    throw new Error('Missing required parameters for subscription confirmation email');
  }

  const features = options.features || [];
  const featuresHtml = features.length > 0 
    ? `
      <p>With your ${options.planName} subscription, you now have access to:</p>
      <ul style="padding-left: 20px; margin-bottom: 20px;">
        ${features.map(feature => `<li style="margin-bottom: 8px;">${feature}</li>`).join('')}
      </ul>
    ` 
    : '';

  const subscriptionDetails = `
    <div style="background-color: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3F51B5;">
      <h3 style="margin-top: 0; color: #3F51B5;">Subscription Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; width: 40%;">Plan:</td>
          <td style="padding: 8px 0;">${options.planName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Price:</td>
          <td style="padding: 8px 0;">${options.price}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Billing Cycle:</td>
          <td style="padding: 8px 0;">${options.billingCycle}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Next Billing Date:</td>
          <td style="padding: 8px 0;">${options.nextBillingDate}</td>
        </tr>
      </table>
    </div>
  `;

  const accountURL = options.accountURL || `${config.FRONTEND_URL}/account/subscription`;

  const emailContent = createEmailTemplate({
    title: 'Subscription Confirmed!',
    preheader: `Your ${options.planName} subscription is now active`,
    greeting: `Hi ${options.firstName},`,
    bodyContent: `
      <p>Thank you for subscribing to the ${options.planName} plan. Your subscription is now active.</p>
      
      ${subscriptionDetails}
      
      ${featuresHtml}
      
      <p>To manage your subscription, visit your account settings:</p>
    `,
    ctaButton: {
      text: 'Manage Subscription',
      url: accountURL
    },
    accentColor: '#3F51B5'
  });
  
  return sendEmail({
    email: options.email,
    subject: options.subject || `Subscription Confirmed: ${options.planName} Plan`,
    html: emailContent
  });
};

/**
 * Send compatibility invitation email
 * @param {string} recipientEmail - Email of recipient
 * @param {string} recipientName - Name of recipient
 * @param {object} sender - Sender details (firstName, lastName)
 * @param {string} message - Personal message from sender
 * @param {string} quizTitle - Title of the compatibility quiz
 * @param {string} shareableLink - Link to take the quiz
 * @returns {Promise<object>} - Returns success status and messageId if email sent successfully
 */
exports.sendCompatibilityInvite = async (recipientEmail, recipientName, sender, message, quizTitle, shareableLink) => {
  if (!recipientEmail || !sender || !sender.firstName || !shareableLink || !quizTitle) {
    throw new Error('Missing required parameters for compatibility invite email');
  }

  let personalMessage = '';
  if (message && message.trim()) {
    personalMessage = `
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; font-style: italic; border-left: 4px solid #757575;">
        "${message}"
      </div>
    `;
  }

  const emailContent = createEmailTemplate({
    title: 'Compatibility Quiz Invitation',
    preheader:` ${sender.firstName} invited you to take a compatibility quiz`,
    greeting:` Hello ${recipientName || 'there'},`,
    bodyContent: `
      <p>${sender.firstName} || ''} has invited you to take the "${quizTitle}" compatibility quiz together.</p>
      
      ${personalMessage}
      
      <p>Taking this quiz together will help you both gain valuable insights about your relationship dynamics and compatibility.</p>
    `,
    ctaButton: {
      text: 'Take the Quiz',
      url: shareableLink
    },
    accentColor: '#4a154b'
  });
  
  return sendEmail({
    email: recipientEmail,
    subject: `${sender.firstName} invited you to take a compatibility quiz!`,
    html: emailContent
  });
};

/**
 * Send a generic notification email
 * @param {object} options - Email details
 * @returns {Promise<object>} - Returns success status and messageId if email sent successfully
 */
exports.sendNotificationEmail = async (options) => {
  if (!options.email || !options.title || !options.message) {
    throw new Error('Missing required parameters for notification email');
  }

  const emailContent = createEmailTemplate({
    title: options.title,
    preheader: options.preheader || options.title,
    greeting: `Hi ${options.firstName || 'there'},`,
    bodyContent: options.message,
    ctaButton: options.actionURL ? {
      text: options.actionText || 'View Details',
      url: options.actionURL
    } : null,
    accentColor: options.accentColor || '#FF5722'
  });
  
  return sendEmail({
    email: options.email,
    subject: options.subject || options.title,
    html: emailContent,
    cc: options.cc,
    bcc: options.bcc,
    attachments: options.attachments
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail: exports.sendVerificationEmail,
  sendPasswordResetEmail: exports.sendPasswordResetEmail,
  sendWelcomeEmail: exports.sendWelcomeEmail,
  sendPartnerInvitationEmail: exports.sendPartnerInvitationEmail,
  sendQuizResultsEmail: exports.sendQuizResultsEmail,
  sendSubscriptionConfirmationEmail: exports.sendSubscriptionConfirmationEmail,
  sendCompatibilityInvite: exports.sendCompatibilityInvite,
  sendNotificationEmail: exports.sendNotificationEmail
};