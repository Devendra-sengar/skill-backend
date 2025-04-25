// const jwt = require('jsonwebtoken');
// const bcrypt = require('bcryptjs');
// const User = require('../models/User');
// const { generateAccessToken } = require('../utils/tokenUtils'); // Helper functions for JWT

// // Register User
// exports.register = async (req, res) => {
//     console.log(req.body)
//   const { username, email, password, dateOfBirth, isAbove18 } = req.body;

//   try {
//     const userExists = await User.findOne({ $or: [{ email }, { username }] });
//     if (userExists) {
//       return res.status(400).json({ message: 'User already exists' });
//     }

//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     const newUser = new User({
//       username,
//       email,
//       passwordHash: hashedPassword,
//       dateOfBirth,
//       isAbove18,
//     });

//     await newUser.save();
//     res.status(201).json({ message: 'User registered successfully' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// // Login User
// exports.login = async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(400).json({ message: 'Invalid credentials' });
//     }

//     const isMatch = await bcrypt.compare(password, user.passwordHash);
//     if (!isMatch) {
//       return res.status(400).json({ message: 'Invalid credentials' });
//     }

//     // Generate tokens
//     const  refreshToken  = generateAccessToken(user);
//     const accessToken = generateAccessToken(user._id);
//     // Set tokens in cookies
//     res.cookie('accessToken', accessToken, {   
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production', // Only true in production
//       sameSite: 'Strict',
//       maxAge: 2 * 24 * 60 * 60 * 1000, // 2 days 
//     });
    
//     res.cookie('refreshToken', refreshToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'Strict',
//       maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
//     });
//     const {passwordHash, ...userData} = user._doc;
//     res.json({ message: 'Logged in successfully',user: userData });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// // Logout User
// exports.logout = (req, res) => {
//   res.clearCookie('accessToken');
//   res.clearCookie('refreshToken');
//   res.json({ message: 'Logged out successfully' });
// };

// // Update User
// exports.updateProfile = async (req, res) => {
//   const { userId } = req.user; // Extracted from JWT middleware
//   const { fullName, educationLevel, schoolName, bio } = req.body;

//   try {
//     const user = await User.findByIdAndUpdate(
//       userId,
//       { fullName, educationLevel, schoolName, bio },
//       { new: true }
//     );
//     res.json(user);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };







const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const emailService = require('../services/emailService');
const { formatResponse } = require('../utils/formatter');
const config = require('../config/auth');
const passport = require('passport');
// Generate JWT token
// const signToken = (id) => {
//   return jwt.sign({ id }, config.JWT_SECRET, {
//     expiresIn: config.JWT_EXPIRES_IN
//   });
// };

// Create and send JWT token
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const refreshToken = crypto.randomBytes(32).toString('hex');
  
  // Save refresh token in database
  user.refreshToken = refreshToken;
  user.lastLogin = Date.now();
  user.save({ validateBeforeSave: false });
  
  // Remove password from output
  user.password = undefined;
  
  const cookieOptions = {
    expires: new Date(
      Date.now() + config.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    sameSite: 'strict' // Added for security
  };
  
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }
  
  res.cookie('jwt', token, cookieOptions);
  
  res.status(statusCode).json(formatResponse(true, {
    user,
    token,
    refreshToken
  }));
};

// Register new user
exports.register = async (req, res, next) => {
  try {
    const { firstName:username, email, password, dateOfBirth, gender } = req.body;
    
    // Input validation
    if (!username || !email || !password) {
      return res.status(400).json(formatResponse(false, null, 'Please provide all required fields'));
    }
    
    // Password validation
    if (password.length < 8) {
      return res.status(400).json(formatResponse(false, null, 'Password must be at least 8 characters long'));
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json(formatResponse(false, null, 'Email already registered'));
    }
    
    // Create new user
    const newUser = await User.create({
      usernName,
      email,
      password,
      dateOfBirth,
      gender
    });
    
    // Generate email verification token
    const verificationToken = newUser.createEmailVerificationToken();
    await newUser.save({ validateBeforeSave: false });
    
    // Send verification email
    const verificationURL = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${verificationToken}`;
    
    try {
      await emailService.sendVerificationEmail({
        email: newUser.email,
        subject: 'Verify Your Email Address',
        username: newUser.username,
        verificationURL
      });

      createSendToken(newUser, 201, res);
    } catch (err) {
      // If email fails, reset the verification token
      newUser.emailVerificationToken = undefined;
      newUser.emailVerificationExpires = undefined;
      await newUser.save({ validateBeforeSave: false });
      
      return res.status(500).json(formatResponse(false, null, 'Error sending verification email. Please try again.'));
    }
  } catch (error) {
    next(error);
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Check if email and password exist
    if (!email || !password) {
      return res.status(400).json(formatResponse(false, null, 'Please provide email and password'));
    }
    
    // Find user and include password field
    const user = await User.findOne({ email }).select('+password');
    
    // Check if user exists and password is correct
    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json(formatResponse(false, null, 'Incorrect email or password'));
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json(formatResponse(false, null, 'Your account has been deactivated'));
    }
    
    // Send token
    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// Logout user
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    sameSite: 'strict'
  });
  
  res.status(200).json(formatResponse(true, { status: 'success' }));
};

// Forgot password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json(formatResponse(false, null, 'Please provide an email address'));
    }
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json(formatResponse(false, null, 'No user found with that email address'));
    }
    
    // Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    
    // Send reset email
    const resetURL = `http://localhost:5173/forgot-password/${resetToken}`;
    
    try {
      await emailService.sendPasswordResetEmail({
        email: user.email,
        subject: 'Password Reset Request',
        username: user.firstName,
        resetURL,
        validityPeriod: '10 minutes'
      });
      
      res.status(200).json(formatResponse(true, { message: 'Password reset email sent' }));
    } catch (err) {
      // If email fails, reset the reset token
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      
      return res.status(500).json(formatResponse(false, null, 'Error sending password reset email. Please try again.'));
    }
  } catch (error) {
    next(error);
  }
};

// Reset password
exports.resetPassword = async (req, res, next) => {
  try {
    const { password, passwordConfirm } = req.body;
    
    // Validate password inputs
    if (!password || !passwordConfirm) {
      return res.status(400).json(formatResponse(false, null, 'Please provide password and password confirmation'));
    }
    
    if (password !== passwordConfirm) {
      return res.status(400).json(formatResponse(false, null, 'Passwords do not match'));
    }
    
    if (password.length < 8) {
      return res.status(400).json(formatResponse(false, null, 'Password must be at least 8 characters long'));
    }
    
    // Get user based on token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');
    
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });
    
    // Check if token is valid
    if (!user) {
      return res.status(400).json(formatResponse(false, null, 'Token is invalid or has expired'));
    }
    
    // Update password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    
    // Log user in
    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// Verify email
exports.verifyEmail = async (req, res, next) => {
  try {
    // Get user based on token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');
    
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });
    
    // Check if token is valid
    if (!user) {
      return res.status(400).json(formatResponse(false, null, 'Email verification token is invalid or has expired'));
    }
    
    // Update user status
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });
    
    // Redirect to frontend
    res.redirect(`${config.FRONTEND_URL}/email-verified`);
  } catch (error) {
    next(error);
  }
};

// Check authentication status
exports.authStatus = async (req, res, next) => {
  try {
    let token;
    // Check if token exists in headers or cookies
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    
    if (!token) {
      return res.status(401).json(formatResponse(false, null, 'You are not logged in'));
    }
    
    // Verify token
    const decoded = await promisify(jwt.verify)(token, config.JWT_SECRET);
    
    // Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json(formatResponse(false, null, 'User no longer exists'));
    }
    
    // Check if user changed password after token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json(formatResponse(false, null, 'User recently changed password. Please log in again'));
    }
    
    // Return user info
    res.status(200).json(formatResponse(true, { user: currentUser }));
  } catch (error) {
    return res.status(401).json(formatResponse(false, null, 'Invalid token. Please log in again'));
  }
};

// Refresh token
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json(formatResponse(false, null, 'Refresh token is required'));
    }
    
    // Find user by refresh token
    const user = await User.findOne({ refreshToken });
    
    if (!user) {
      return res.status(401).json(formatResponse(false, null, 'Invalid refresh token'));
    }
    
    // Generate new tokens
    const newToken = signToken(user._id);
    const newRefreshToken = crypto.randomBytes(32).toString('hex');
    
    // Update refresh token in database
    user.refreshToken = newRefreshToken;
    user.lastLogin = Date.now(); // Update last login time
    await user.save({ validateBeforeSave: false });
    
    // Send response with secure cookie options
    const cookieOptions = {
      expires: new Date(
        Date.now() + config.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      sameSite: 'strict'
    };
    
    if (process.env.NODE_ENV === 'production') {
      cookieOptions.secure = true;
    }
    
    res.cookie('jwt', newToken, cookieOptions);
    
    res.status(200).json(formatResponse(true, {
      token: newToken,
      refreshToken: newRefreshToken
    }));
  } catch (error) {
    next(error);
  }
};


const signToken = (id) => {
  return jwt.sign({ id }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN
  });
};

// Handle successful Google authentication
exports.googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, async (err, user, info) => {
    console.log("aa gya bhai")
    try {
      if (err) {
        console.error("Google authentication error:", err.message);
        return res.redirect(`${config.FRONTEND_URL}/login?error=${encodeURIComponent('Authentication failed')}`);
      }
      
      if (!user) {
        return res.redirect(`${config.FRONTEND_URL}/login?error=${encodeURIComponent('User not found')}`);
      }
      
      // Generate JWT token
      const token = signToken(user._id);
      const refreshToken = crypto.randomBytes(32).toString('hex');
      console.log("checking user ",user)
      console.log("check info",info);
      // Save refresh token in database
      user.refreshToken = refreshToken;
      user.lastLogin = Date.now();
      await user.save({ validateBeforeSave: false });
      
      // Create a user object with necessary information
      const userObj = {
        _id: user._id,
        username: user.username,
        email: user.email,
        emailVerified: user.emailVerified,
        role: user.role,
        profilePicture: user.profilePicture,
        hasGoogleAuth: !!user.googleId
      };
      console.log(userObj)
      // Redirect to frontend with tokens in URL parameters
      return res.redirect(
        `${config.FRONTEND_URL}/auth/social-callback?token=${token}&refreshToken=${refreshToken}&user=${encodeURIComponent(JSON.stringify(userObj))}`
      );
    } catch (error) {
      console.error("Error in Google callback:", error);
      return res.redirect(`${config.FRONTEND_URL}/login?error=${encodeURIComponent('Server error')}`);
    }
  })(req, res, next);
};

// Check if email exists (for social login)
exports.checkEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json(formatResponse(false, null, 'Email is required'));
    }
    
    const user = await User.findOne({ email });
    
    return res.status(200).json(formatResponse(true, {
      exists: !!user,
      hasPassword: user ? !!user.password : false,
      hasGoogleAuth: user ? !!user.googleId : false
    }));
  } catch (error) {
    next(error);
  }
};

// Link Google account to existing user
exports.linkGoogleAccount = async (req, res, next) => {
  try {
    const { userId, googleId, googleEmail } = req.body;
    
    if (!userId || !googleId || !googleEmail) {
      return res.status(400).json(formatResponse(false, null, 'Missing required information'));
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json(formatResponse(false, null, 'User not found'));
    }
    
    // Update user with Google information
    user.googleId = googleId;
    
    // If email isn't verified yet, verify it now (Google verifies emails)
    if (!user.emailVerified && user.email === googleEmail) {
      user.emailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
    }
    
    await user.save({ validateBeforeSave: false });
    
    res.status(200).json(formatResponse(true, { user }));
  } catch (error) {
    next(error);
  }
};

// Unlink Google account
exports.unlinkGoogleAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // Ensure user has a password before unlinking
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      return res.status(404).json(formatResponse(false, null, 'User not found'));
    }
    
    if (!user.password) {
      return res.status(400).json(formatResponse(false, null, 'You need to set a password before unlinking Google account'));
    }
    
    // Remove Google ID
    user.googleId = undefined;
    await user.save({ validateBeforeSave: false });
    
    res.status(200).json(formatResponse(true, { message: 'Google account unlinked successfully' }));
  } catch (error) {
    next(error);
  }
};