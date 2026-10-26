import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BusinessProfile',
      required: true,
    },
    businessUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      index: true,
    },
    budgetAmount: {
      type: Number,
      required: [true, 'Budget amount is required'],
      min: [0, 'Budget must be positive'],
    },
    durationWeeks: {
      type: Number,
      required: [true, 'Duration in weeks is required'],
      min: [1, 'Duration must be at least 1 week'],
    },
    shortDescription: {
      type: String,
      required: [true, 'Short description is required'],
    },
    fullDescription: {
      type: String,
      required: [true, 'Full description is required'],
    },
    deliverables: [{ type: String }],
    requiredSkills: [{
      type: String,
      index: true,
    }],
    arrangement: {
      type: String,
      enum: ['Remote', 'Hybrid', 'In-Person'],
      default: 'Remote',
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Selected', 'Completed', 'Closed'],
      default: 'Open',
      index: true,
    },
    applicantCount: {
      type: Number,
      default: 0,
    },
    selectedApplicant: {
      applicantType: { type: String, enum: ['individual', 'team'] },
      student: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile' },
      team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for searching & filtering
projectSchema.index({ status: 1, category: 1, budgetAmount: -1 });
projectSchema.index({ title: 'text', shortDescription: 'text', fullDescription: 'text' });

export const Project = mongoose.model('Project', projectSchema);
