import mongoose from 'mongoose';

const teamMemberSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudentProfile',
    required: true,
  },
  role: {
    type: String,
    default: 'Team Contributor',
  },
  isLeader: {
    type: Boolean,
    default: false,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

const teamJoinRequestSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudentProfile',
    required: true,
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
});

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentProfile',
      required: true,
    },
    members: [teamMemberSchema],
    combinedSkills: [{
      type: String,
      index: true,
    }],
    projectInterests: [{ type: String }],
    openPositions: [{ type: String }],
    visibility: {
      type: String,
      enum: ['Public (Discoverable by Businesses & Students)', 'Private'],
      default: 'Public (Discoverable by Businesses & Students)',
    },
    completedProjectsCount: {
      type: Number,
      default: 0,
    },
    pendingJoinRequests: [teamJoinRequestSchema],
  },
  {
    timestamps: true,
  }
);

export const Team = mongoose.model('Team', teamSchema);
