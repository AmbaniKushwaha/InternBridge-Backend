import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BusinessProfile',
      required: true,
      index: true,
    },
    applicantType: {
      type: String,
      enum: ['individual', 'team'],
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentProfile',
      required: function () {
        return this.applicantType === 'individual';
      },
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: function () {
        return this.applicantType === 'team';
      },
    },
    proposalText: {
      type: String,
      required: [true, 'Proposal text is required'],
      minlength: [20, 'Proposal must be at least 20 characters'],
    },
    relevantSkills: [{ type: String }],
    highlightedPortfolioProject: { type: String, default: '' },
    availability: { type: String, default: '' },
    estimatedTimeline: { type: String, default: '' },
    notes: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Pending', 'Shortlisted', 'Interview', 'Selected', 'Rejected'],
      default: 'Pending',
      index: true,
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 70,
    },
    matchReasons: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate application from same individual or team for same project
applicationSchema.index({ project: 1, student: 1 }, { unique: true, sparse: true });
applicationSchema.index({ project: 1, team: 1 }, { unique: true, sparse: true });

export const Application = mongoose.model('Application', applicationSchema);
