import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('No image file uploaded. Please select an image.', 400));
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
      return next(new AppError('No image file uploaded. Please select an image.', 400));
    }

    const relativeUrl = `/uploads/${req.file.filename}`;
    const fullUrl = `${req.protocol}://${req.get('host')}${relativeUrl}`;

    // Update the authenticated user's avatar in MongoDB
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: relativeUrl },
      { new: true }
    );

    res.status(200).json({
      status: 'success',
      data: {
        avatar: relativeUrl,
        fullUrl,
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

