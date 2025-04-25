 
  // Team Model (for premium users)
  const mongoose = require('mongoose');
  const TeamSchema = new mongoose.Schema({
    name: {
      type: String,
      required: [true, 'A team must have a name'],
      trim: true,
      maxlength: [40, 'Team name cannot exceed 40 characters'],
      minlength: [3, 'Team name must be at least 3 characters']
    },
    ownerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true 
    },
    competition: {
      type: mongoose.Schema.ObjectId,
      ref: 'Competition',
      required: [true, 'A team must belong to a hackathon']
    },
    submission: {
      type: {
        repoUrl: {
          type: String,
          validate: {
            validator: function (v) {
              return /^(https?:\/\/)?(www\.)?github\.com\/.+/i.test(v);
            },
            message: 'Must be a valid GitHub repository URL'
          }
        },
        demoUrl: String,
        description: String,
        submittedAt: Date
      },
      default: null
    },
    members: [{
      userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
      },
      joinedAt: { type: Date, default: Date.now },
      status: { type: String } // Active, Inactive
    }],
    createdAt: { type: Date, default: Date.now },
    description: { type: String },
    performanceStats: {
      totalEarnings: { type: Number, default: 0 },
      winRate: { type: Number, default: 0 },
      competitionsParticipated: { type: Number, default: 0 }
    },
    captain: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A team must have a captain']
    },
    disqualified: {
      type: Boolean,
      default: false
    },
    disqualificationReason: String,
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: null
    },
    rank: Number,
    result: {
      type: String,
      enum: ['Winner', 'Finalist', 'Semi-Finalist', 'Participant'],
      default: 'Participant'
    },
    performanceScore: {
      type: Number,
      min: 0,
      max: 100
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });
   

// Indexes for performance
TeamSchema.index({ competition: 1, name: 1 }, { unique: true });
TeamSchema.index({ members: 1 });
TeamSchema.index({ captain: 1 });
TeamSchema.index({ ownerId: 1 });

// Virtuals
TeamSchema.virtual('memberCount').get(function () {
  return this.members.length;
});
TeamSchema.pre('validate', function(next) {
  if (this.members.length < 1) {
    this.invalidate('members', 'A team must have at least one member');
  }
  next();
});
// Document Middleware
// Document Middleware
TeamSchema.pre('save', async function(next) {
  // Ensure captain is in members
  if (!this.members.some(member => member.equals(this.captain))) {
    this.members.unshift(this.captain);
  }

  // Prevent duplicate members
  const uniqueMemberStrings = [...new Set(this.members.map(m => m.toString()))];
  this.members = uniqueMemberStrings.map(id => new mongoose.Types.ObjectId(id));

  next();
});

TeamSchema.pre(/^find/, function (next) {
  this.populate({ path: 'members', select: 'name avatar grade' })
    .populate({ path: 'captain', select: 'name email' })
    .populate({ path: 'User', select: 'name' });
  next();
});

// Query Middleware
TeamSchema.pre('findOneAndUpdate', async function (next) {
  const docToUpdate = await this.model.findOne(this.getQuery());

  // Prevent changing hackathon after creation
  if (this._update.hackathon && !docToUpdate.hackathon.equals(this._update.hackathon)) {
    return next(new AppError('Cannot change team hackathon', 400));
  }

  next();
});

// Instance Methods
TeamSchema.methods.isMember = function (userId) {
  return this.members.some(member => member.equals(userId));
};

TeamSchema.methods.isCaptain = function (userId) {
  return this.captain.equals(userId);
};

TeamSchema.methods.addMember = async function (participantId) {
  if (this.members.includes(participantId)) {
    throw new AppError('Participant already in team', 400);
  }

  this.members.push(participantId);
  return this.save();
};

TeamSchema.methods.removeMember = async function (participantId) {
  if (!this.members.includes(participantId)) {
    throw new AppError('Participant not in team', 400);
  }

  if (this.captain.equals(participantId)) {
    throw new AppError('Cannot remove captain', 400);
  }

  this.members = this.members.filter(member => !member.equals(participantId));

  return this.save();
};

module.exports = mongoose.model('Team', TeamSchema); 