import mongoose from 'mongoose';

const businessProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    businessType: {
      type: String,
      default: 'Retail & D2C',
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    websiteUrl: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: 'India',
    },
    contactPerson: {
      type: String,
      default: 'Project Lead',
    },
    preferredArrangement: {
      type: String,
      enum: ['Remote', 'Hybrid', 'In-Person'],
      default: 'Remote',
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const BusinessProfile = mongoose.model('BusinessProfile', businessProfileSchema);
