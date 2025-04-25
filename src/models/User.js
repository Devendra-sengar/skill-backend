// // User Model
// const mongoose = require('mongoose');   
// const UserSchema = new mongoose.Schema({
//     username: { type: String, required: true, unique: true },
//     email: { type: String, required: true, unique: true },
//     passwordHash: { type: String, required: true },
//     dateOfBirth: { type: Date, required: true },
//     isAbove18: { type: Boolean, required: true },
//     isPremium: { type: Boolean, default: false },
//     balance: { type: Number, default: 0 },
//     profile: {
//       fullName: { type: String },
//       educationLevel: { type: String },
//       schoolName: { type: String },
//       preferredSubjects: [String],
//       bio: { type: String },
//       profilePictureUrl: { type: String },
//       contactNumber: { type: String },
//       address: { type: String }
//     },  
//     skillAssessments: [{ 
//       subject: { type: String, required: true },
//       score: { type: Number, required: true },
//       level: { type: String, required: true },
//       takenAt: { type: Date, default: Date.now },
//       strengths: [String],
//       weaknesses: [String]
//     }],
//     createdAt: { type: Date, default: Date.now },
//     lastLogin: { type: Date }
//   });
  
// module.exports = mongoose.model('User', UserSchema);
  
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  // Basic Info for new user
  username: { type: String, required: true, },
  balance: { type: Number, default: 200 },
  // lastName: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/, 'Invalid email'],
  },
  password: {
    type: String,
    required: function() {
      // Only require password if user doesn't have a googleId
      return !this.googleId;
    },
    minlength: 8,
    select: false
  },
  profilePicture: {
    type: String,
    default: 'default-profile.jpg'
  },
  refreshToken: String, // Added to store refresh token 

  // Add Google Authentication fields
  googleId: {
    type: String,
    unique: true,
    sparse: true  // This allows the field to be unique but also optional
  },

  // Account & Auth 
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  passwordChangedAt: Date,
  lastLogin: Date,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },

  // Subscription
  // subscriptionStatus: { type: String, enum: ['free', 'premium'], default: 'free' },
  subscriptionExpiry: Date,

  // Personal & Relationship Info
  dateOfBirth: Date,
  gender: { type: String, enum: ['Male', 'Female', 'Other', 'prefer not to say'] },
  relationshipStatus: {
    type: String,
    enum: ['Single', 'In a relationship', 'Engaged', 'Married', 'Divorced', 'Complicated', 'prefer not to say'],
    default: 'prefer not to say'
  },
  relationshipDuration: {
    type: String,
    enum: ['less than 1 year', '1-3 years', '3-5 years', '5-10 years', 'more than 10 years', 'not applicable']
  },
  living_situation :{
  type: String,
    enum: ['Living together','Living apart','Long-distance','Married but separated' ,'not applicable']
  },

  country:{
    type : String,
    requried : true
  },
  state:{
    type : String,
    requried : true
  },
  city:{
    type : String,
    requried : true
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  premiumPlan: {
    type: String,
    enum: ['monthly', 'yearly', null],
    default: null
  },
  stripeCustomerId: {
    type: String
  }
  
}, { timestamps: true });

// Pre-save password hash - Modified for Google Auth
userSchema.pre('save', async function(next) {
  // Only run this function if password field was actually modified or if using social login
  if (!this.isModified('password') || this.googleId) return next();
  
  // Don't proceed with password hashing if password is undefined or empty
  if (!this.password) {
    // This might be happening when you verify email
    // Retrieve the current password from database if we're about to lose it
    if (!this.isNew) {
      const currentUser = await mongoose.model('User').findById(this._id).select('+password');
      if (currentUser && currentUser.password) {
        this.password = currentUser.password;
      }
    }
    return next();
  }
  
  try {
    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    
    // Update passwordChangedAt field if not a new user
    if (!this.isNew) {
      this.passwordChangedAt = Date.now() - 1000;
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Filter inactive users
userSchema.pre(/^find/, function(next) {
  this.find({ isActive: { $ne: false } });
  next();
});

// Compare password
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  // Check that both passwords exist
  if (!candidatePassword || !userPassword) {
    throw new Error('Both candidate password and user password are required');
  }
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Reset token generator
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

// Email verification token
userSchema.methods.createEmailVerificationToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

// JWT password change check
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Subscription status check
userSchema.methods.hasActiveSubscription = function() {
  if (this.subscriptionStatus === 'free') return true;
  if (this.subscriptionStatus === 'premium' && this.subscriptionExpiry > Date.now()) {
    return true;
  }
  return false;
};

// Get partner data
userSchema.methods.getPartnerInfo = async function() {
  if (!this.isPartnerLinked || !this.partnerEmail) return null;
  const Partner = mongoose.model('User');
  return await Partner.findOne({ email: this.partnerEmail });
};

// Virtual full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} `;
});

// Add index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ refreshToken: 1 });
// userSchema.index({ googleId: 1 });

const User = mongoose.model('User', userSchema);
module.exports = User;