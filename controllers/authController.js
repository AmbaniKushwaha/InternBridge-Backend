import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { BusinessProfile } from '../models/BusinessProfile.js';
import { Notification } from '../models/Notification.js';
import { AppError } from '../utils/AppError.js';

const signToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'internbridge_jwt_secret_dev_key_super_secure_2026',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

export const register = async (req, res, next) => {
  try {
    const { email, password, name, role, ...profileData } = req.body;

    if (!email || !password || !name || !role) {
      return next(new AppError('Please provide email, password, name, and role.', 400));
    }

    if (password.length < 6) {
      return next(new AppError('Password must be at least 6 characters long.', 400));
    }

    const trimmedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return next(new AppError('An account with this email address already exists. Please sign in.', 400));
    }

    // Default avatars if not provided
    const defaultAvatar = role === 'student'
      ? (profileData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80')
      : (profileData.avatar || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150&auto=format&fit=crop&q=80');

    // 1. Create User in MongoDB
    const newUser = await User.create({
      email: trimmedEmail,
      password,
      name: name.trim(),
      role,
      avatar: defaultAvatar,
    });

    // 2. Create role-specific profile in MongoDB
    let profile;
    if (role === 'student') {
      profile = await StudentProfile.create({
        user: newUser._id,
        college: profileData.college || 'Engineering College',
        course: profileData.course || 'B.Tech CSE',
        graduationYear: Number(profileData.graduationYear) || 2026,
        bio: profileData.bio || '',
        selfReportedSkills: Array.isArray(profileData.selfReportedSkills)
          ? profileData.selfReportedSkills
          : (profileData.skillsStr ? profileData.skillsStr.split(',').map((s) => s.trim()).filter(Boolean) : ['JavaScript', 'React']),
        interests: Array.isArray(profileData.interests) ? profileData.interests : ['Web Development'],
        availability: profileData.availability || '15-25 hrs/week',
        preferredArrangement: profileData.preferredArrangement || 'Remote',
        experienceLevel: profileData.experienceLevel || 'Intermediate',
        githubUrl: profileData.githubUrl || '',
        linkedinUrl: profileData.linkedinUrl || '',
        websiteUrl: profileData.websiteUrl || '',
      });
    } else if (role === 'business') {
      profile = await BusinessProfile.create({
        user: newUser._id,
        companyName: profileData.companyName || name.trim(),
        businessType: profileData.businessType || 'Retail & D2C',
        description: profileData.description || '',
        websiteUrl: profileData.websiteUrl || '',
        location: profileData.location || 'India',
        contactPerson: profileData.contactPerson || name.trim(),
        preferredArrangement: profileData.preferredArrangement || 'Remote',
        isVerified: true,
      });
    }

    // 3. Welcome notification in MongoDB
    await Notification.create({
      recipient: newUser._id,
      title: 'Welcome to InternBridge!',
      message: role === 'student'
        ? `Welcome ${newUser.name}! Your student profile has been registered in the database. You can now explore briefs and join squads.`
        : `Welcome ${newUser.name}! Your enterprise business account is verified. You can now post project briefs and review student applicants.`,
      type: 'system',
      link: role === 'student' ? '/projects' : '/business/projects/new',
    }).catch((err) => console.warn('Welcome notification note:', err.message));

    const token = signToken(newUser._id);
    newUser.password = undefined;

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: newUser,
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide both email and password.', 400));
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Find user with password selected
    const user = await User.findOne({ email: trimmedEmail }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Invalid email or password. Please verify your credentials.', 401));
    }

    if (!user.isActive) {
      return next(new AppError('This user account has been deactivated.', 403));
    }

    // Role check if user explicitly requested a specific role
    if (role && role !== user.role && user.role !== 'admin') {
      return next(
        new AppError(`This account is registered as a ${user.role}. Please select the ${user.role} role to sign in.`, 400)
      );
    }

    // Retrieve associated profile
    let profile = null;
    if (user.role === 'student') {
      profile = await StudentProfile.findOne({ user: user._id });
    } else if (user.role === 'business') {
      profile = await BusinessProfile.findOne({ user: user._id });
    }

    const token = signToken(user._id);
    user.password = undefined;

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user,
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = req.user;
    let profile = null;

    if (user.role === 'student') {
      profile = await StudentProfile.findOne({ user: user._id });
    } else if (user.role === 'business') {
      profile = await BusinessProfile.findOne({ user: user._id });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user,
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const updateData = {};

    if (name && name.trim()) {
      updateData.name = name.trim();
    }
    if (avatar !== undefined) {
      updateData.avatar = avatar;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    let profile = null;
    if (updatedUser.role === 'student') {
      profile = await StudentProfile.findOne({ user: updatedUser._id }).populate('user', 'name avatar email');
    } else if (updatedUser.role === 'business') {
      if (name && name.trim()) {
        await BusinessProfile.findOneAndUpdate(
          { user: updatedUser._id },
          { contactPerson: name.trim() }
        );
      }
      profile = await BusinessProfile.findOne({ user: updatedUser._id }).populate('user', 'name avatar email');
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
};
