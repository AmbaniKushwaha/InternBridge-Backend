import { User } from '../models/User.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { BusinessProfile } from '../models/BusinessProfile.js';
import { AppError } from '../utils/AppError.js';

export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('No image file uploaded. Please select an image file to proceed.', 400));
    }

    const relativeUrl = `/uploads/${req.file.filename}`;
    const fullUrl = `${req.protocol}://${req.get('host')}${relativeUrl}`;

    res.status(200).json({
      status: 'success',
      data: {
        filename: req.file.filename,
        url: relativeUrl,
        fullUrl,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('No image file provided. Please choose a JPG, PNG, WEBP, or GIF file under 5MB.', 400));
    }

    const relativeUrl = `/uploads/${req.file.filename}`;
    const fullUrl = `${req.protocol}://${req.get('host')}${relativeUrl}`;

    let updatedUser = null;
    let updatedProfile = null;

    // If user is authenticated, persist avatar to their User record in MongoDB
    if (req.user?._id) {
      updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { avatar: relativeUrl },
        { new: true }
      );

      if (updatedUser.role === 'student') {
        updatedProfile = await StudentProfile.findOne({ user: updatedUser._id });
      } else if (updatedUser.role === 'business') {
        updatedProfile = await BusinessProfile.findOne({ user: updatedUser._id });
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'Profile picture uploaded and saved successfully.',
      data: {
        avatar: relativeUrl,
        url: relativeUrl,
        avatarUrl: relativeUrl,
        fullUrl,
        user: updatedUser,
        profile: updatedProfile,
      },
    });
  } catch (error) {
    next(error);
  }
};
