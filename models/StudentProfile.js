import mongoose from 'mongoose';

const portfolioItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Portfolio project title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
  },
  projectType: {
    type: String,
    default: 'Web Development',
  },
  technologies: [{ type: String }],
  skillsDemonstrated: [{ type: String }],
  githubUrl: { type: String, default: '' },
  liveUrl: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  completedDate: { type: String, default: '' },
  personalRole: { type: String, default: 'Contributor' },
  contextType: {
    type: String,
    enum: ['Personal Project', 'College Project', 'Client Work', 'Open Source'],
    default: 'Personal Project',
  },
});

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    college: {
      type: String,
      default: '',
      trim: true,
    },
    course: {
      type: String,
      default: '',
      trim: true,
    },
    graduationYear: {
      type: Number,
      default: 2026,
    },
    bio: {
      type: String,
      default: '',
    },
    selfReportedSkills: [{
      type: String,
      index: true,
    }],
    interests: [{ type: String }],
    availability: {
      type: String,
      default: '15-25 hrs/week',
    },
    preferredArrangement: {
      type: String,
      enum: ['Remote', 'Hybrid', 'In-Person'],
      default: 'Remote',
    },
    preferredProjectTypes: [{ type: String }],
    experienceLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Intermediate',
    },
    githubUrl: { type: String, default: '' },
    linkedinUrl: { type: String, default: '' },
    websiteUrl: { type: String, default: '' },
    completedProjectsCount: {
      type: Number,
      default: 0,
    },
    portfolioItems: [portfolioItemSchema],
  },
  {
    timestamps: true,
  }
);

export const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);
