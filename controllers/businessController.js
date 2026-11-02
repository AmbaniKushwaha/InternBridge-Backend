import { BusinessProfile } from '../models/BusinessProfile.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

export const getAllBusinesses = async (req, res, next) => {
  try {
    const businesses = await BusinessProfile.find()
      .populate('user', 'name avatar email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: businesses.length,
      data: { businesses },
    });
  } catch (error) {
    next(error);
  }
};

export const getBusinessById = async (req, res, next) => {
  try {
    const business = await BusinessProfile.findById(req.params.id)
      .populate('user', 'name avatar email');

    if (!business) {
      return next(new AppError('Business profile not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { business },
    });
  } catch (error) {
    next(error);
  }
};

export const updateBusinessProfile = async (req, res, next) => {
  try {
    const {
      companyName,
      name,
      avatar,
      logo,
      businessType,
      description,
      location,
      contactPerson,
      websiteUrl,
      preferredArrangement,
    } = req.body;

    const resolvedCompanyName = (companyName || name || '').trim();

    // Server-side validation
    if (companyName !== undefined || name !== undefined) {
      if (!resolvedCompanyName || resolvedCompanyName.length < 2) {
        return next(new AppError('Company name must be at least 2 characters long.', 400));
      }
    }

    let businessProfile = await BusinessProfile.findOne({ user: req.user._id });

    const updateFields = {
      companyName: resolvedCompanyName || businessProfile?.companyName || req.user.name,
      businessType: businessType || businessProfile?.businessType || 'Retail & D2C',
      description: description !== undefined ? description : businessProfile?.description || '',
      location: location || businessProfile?.location || 'India',
      contactPerson: contactPerson || name || businessProfile?.contactPerson || req.user.name,
      websiteUrl: websiteUrl !== undefined ? websiteUrl : businessProfile?.websiteUrl || '',
      preferredArrangement: preferredArrangement || businessProfile?.preferredArrangement || 'Remote',
    };

    if (!businessProfile) {
      businessProfile = await BusinessProfile.create({
        user: req.user._id,
        ...updateFields,
      });
    } else {
      Object.assign(businessProfile, updateFields);
      await businessProfile.save();
    }

    const userUpdate = {};
    if (name || contactPerson) userUpdate.name = (name || contactPerson).trim();
    const resolvedAvatar = avatar !== undefined ? avatar : logo;
    if (resolvedAvatar !== undefined) userUpdate.avatar = resolvedAvatar;

    let updatedUser = null;
    if (Object.keys(userUpdate).length > 0) {
      updatedUser = await User.findByIdAndUpdate(req.user._id, userUpdate, {
        new: true,
        runValidators: true,
      });
    }

    await businessProfile.populate('user', 'name avatar email');

    res.status(200).json({
      status: 'success',
      message: 'Business profile updated successfully in database.',
      data: {
        business: businessProfile,
        user: updatedUser || businessProfile.user,
      },
    });
  } catch (error) {
    next(error);
  }
};
