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
    const businessProfile = await BusinessProfile.findOne({ user: req.user._id });
    if (!businessProfile) {
      return next(new AppError('Business profile not found for this account', 404));
    }

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

    const resolvedCompanyName = companyName || name;
    if (resolvedCompanyName) {
      businessProfile.companyName = resolvedCompanyName;
    }
    if (businessType !== undefined) businessProfile.businessType = businessType;
    if (description !== undefined) businessProfile.description = description;
    if (location !== undefined) businessProfile.location = location;
    if (contactPerson !== undefined) businessProfile.contactPerson = contactPerson;
    if (websiteUrl !== undefined) businessProfile.websiteUrl = websiteUrl;
    if (preferredArrangement !== undefined) businessProfile.preferredArrangement = preferredArrangement;

    await businessProfile.save();

    const userUpdate = {};
    if (name || contactPerson) userUpdate.name = name || contactPerson;
    const resolvedAvatar = avatar !== undefined ? avatar : logo;
    if (resolvedAvatar !== undefined) userUpdate.avatar = resolvedAvatar;

    let updatedUser = null;
    if (Object.keys(userUpdate).length > 0) {
      updatedUser = await User.findByIdAndUpdate(req.user._id, userUpdate, { new: true });
    }

    await businessProfile.populate('user', 'name avatar email');

    res.status(200).json({
      status: 'success',
      data: {
        business: businessProfile,
        user: updatedUser || businessProfile.user,
      },
    });
  } catch (error) {
    next(error);
  }
};
