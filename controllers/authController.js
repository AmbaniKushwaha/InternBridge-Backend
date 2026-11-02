import { User } from '../models/User.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { BusinessProfile } from '../models/BusinessProfile.js';
import { Notification } from '../models/Notification.js';
import { AppError } from '../utils/AppError.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  setAuthCookies,
  clearAuthCookies,
} from '../utils/tokenUtils.js';

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

    // 4. Generate short-lived access token and longer-lived refresh token
    const accessToken = signAccessToken(newUser._id
      
    );
    const refreshToken = signRefreshToken(newUser._id);

    // Save hashed refresh token to user in database for revocation checks
    await User.findByIdAndUpdate(newUser._id, { refreshToken: hashToken(refreshToken) });

    // Set secure HttpOnly cookies
    setAuthCookies(res, accessToken, refreshToken);

    newUser.password = undefined;
    newUser.refreshToken = undefined;

    res.status(201).json({
      status: 'success',
      accessToken,
      token: accessToken, // for backwards compatibility
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

    // Generate short-lived access token and longer-lived refresh token
    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    // Store hashed refresh token in database
    await User.findByIdAndUpdate(user._id, { refreshToken: hashToken(refreshToken) });

    // Set secure HttpOnly cookies
    setAuthCookies(res, accessToken, refreshToken);

    user.password = undefined;
    user.refreshToken = undefined;

    res.status(200).json({
      status: 'success',
      accessToken,
      token: accessToken, // for backwards compatibility
      data: {
        user,
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token using HttpOnly refresh token cookie (or body fallback)
 */
export const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token) {
      return next(new AppError('No refresh token provided. Please log in to continue.', 401));
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (err) {
      clearAuthCookies(res);
      if (err.name === 'TokenExpiredError') {
        const error = new AppError('Your session has expired. Please log in again.', 401);
        error.code = 'REFRESH_TOKEN_EXPIRED';
        return next(error);
      }
      return next(new AppError('Invalid refresh token. Please log in again.', 401));
    }

    // Find user with refreshToken selected
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user) {
      clearAuthCookies(res);
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    if (!user.isActive) {
      clearAuthCookies(res);
      return next(new AppError('This user account has been deactivated.', 403));
    }

    // Revocation & token reuse check
    const hashed = hashToken(token);
    if (!user.refreshToken || user.refreshToken !== hashed) {
      // Token was revoked or does not match active session - revoke immediately
      await User.findByIdAndUpdate(user._id, { $unset: { refreshToken: 1 } });
      clearAuthCookies(res);
      return next(new AppError('Refresh token has been revoked or invalidated. Please log in again.', 401));
    }

    // Generate new access token and rotated refresh token
    const newAccessToken = signAccessToken(user._id);
    const newRefreshToken = signRefreshToken(user._id);

    // Update stored refresh token in database (rotation)
    await User.findByIdAndUpdate(user._id, { refreshToken: hashToken(newRefreshToken) });

    // Update cookies
    setAuthCookies(res, newAccessToken, newRefreshToken);

    res.status(200).json({
      status: 'success',
      message: 'Access token refreshed successfully',
      accessToken: newAccessToken,
      token: newAccessToken,
      data: {
        user: {
          _id: user._id,
          id: user._id,
          email: user.email,
          role: user.role,
          name: user.name,
          avatar: user.avatar,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear HttpOnly cookies and revoke refresh token in database
 */
export const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    // 1. Revoke refresh token in database
    if (req.user?._id) {
      await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
    } else if (token) {
      try {
        const decoded = verifyRefreshToken(token);
        if (decoded?.id) {
          await User.findByIdAndUpdate(decoded.id, { $unset: { refreshToken: 1 } });
        }
      } catch {
        // Token was already expired or invalid, still proceed
      }
    }

    // 2. Clear secure HttpOnly cookies
    clearAuthCookies(res);

    res.status(200).json({
      status: 'success',
      message: 'Successfully logged out and session revoked.',
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
      profile = await StudentProfile.findOne({ user: user._id }).populate('user', 'name avatar email');
    } else if (user.role === 'business') {
      profile = await BusinessProfile.findOne({ user: user._id }).populate('user', 'name avatar email');
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
    const user = req.user;
    const {
      name,
      avatar,
      college,
      course,
      graduationYear,
      bio,
      selfReportedSkills,
      interests,
      availability,
      preferredArrangement,
      experienceLevel,
      githubUrl,
      linkedinUrl,
      websiteUrl,
      companyName,
      businessType,
      description,
      location,
      contactPerson,
      contactEmail,
    } = req.body;

    // Server-side validation
    if (name !== undefined) {
      if (!name || name.trim().length < 2) {
        return next(new AppError('Full name must be at least 2 characters long.', 400));
      }
    }

    if (graduationYear !== undefined && graduationYear !== null && graduationYear !== '') {
      const year = Number(graduationYear);
      if (isNaN(year) || year < 1980 || year > 2040) {
        return next(new AppError('Graduation year must be a valid four-digit year between 1980 and 2040.', 400));
      }
    }

    // 1. Update User record
    const userUpdate = {};
    if (name && name.trim()) userUpdate.name = name.trim();
    if (avatar !== undefined) userUpdate.avatar = avatar;

    let updatedUser = user;
    if (Object.keys(userUpdate).length > 0) {
      updatedUser = await User.findByIdAndUpdate(user._id, userUpdate, {
        new: true,
        runValidators: true,
      });
    }

    // 2. Update role-specific profile in MongoDB
    let profile = null;

    if (user.role === 'student') {
      let studentProfile = await StudentProfile.findOne({ user: user._id });

      const profileFields = {
        college: college !== undefined ? college : studentProfile?.college || '',
        course: course !== undefined ? course : studentProfile?.course || '',
        graduationYear: graduationYear ? Number(graduationYear) : studentProfile?.graduationYear || 2026,
        bio: bio !== undefined ? bio : studentProfile?.bio || '',
        selfReportedSkills: selfReportedSkills !== undefined
          ? (Array.isArray(selfReportedSkills) ? selfReportedSkills : selfReportedSkills.split(',').map((s) => s.trim()).filter(Boolean))
          : studentProfile?.selfReportedSkills || [],
        interests: interests !== undefined
          ? (Array.isArray(interests) ? interests : interests.split(',').map((s) => s.trim()).filter(Boolean))
          : studentProfile?.interests || [],
        availability: availability || studentProfile?.availability || '15-25 hrs/week',
        preferredArrangement: preferredArrangement || studentProfile?.preferredArrangement || 'Remote',
        experienceLevel: experienceLevel || studentProfile?.experienceLevel || 'Intermediate',
        githubUrl: githubUrl !== undefined ? githubUrl : studentProfile?.githubUrl || '',
        linkedinUrl: linkedinUrl !== undefined ? linkedinUrl : studentProfile?.linkedinUrl || '',
        websiteUrl: websiteUrl !== undefined ? websiteUrl : studentProfile?.websiteUrl || '',
      };

      if (!studentProfile) {
        studentProfile = await StudentProfile.create({
          user: user._id,
          ...profileFields,
        });
      } else {
        Object.assign(studentProfile, profileFields);
        await studentProfile.save();
      }

      await studentProfile.populate('user', 'name avatar email');
      profile = studentProfile;
    } else if (user.role === 'business') {
      let businessProfile = await BusinessProfile.findOne({ user: user._id });

      const resolvedCompanyName = companyName || name;
      const profileFields = {
        companyName: resolvedCompanyName || businessProfile?.companyName || user.name,
        businessType: businessType || businessProfile?.businessType || 'Retail & D2C',
        description: description !== undefined ? description : businessProfile?.description || '',
        location: location || businessProfile?.location || 'India',
        contactPerson: contactPerson || name || businessProfile?.contactPerson || user.name,
        websiteUrl: websiteUrl !== undefined ? websiteUrl : businessProfile?.websiteUrl || '',
        preferredArrangement: preferredArrangement || businessProfile?.preferredArrangement || 'Remote',
      };

      if (!businessProfile) {
        businessProfile = await BusinessProfile.create({
          user: user._id,
          ...profileFields,
        });
      } else {
        Object.assign(businessProfile, profileFields);
        await businessProfile.save();
      }

      await businessProfile.populate('user', 'name avatar email');
      profile = businessProfile;
    }

    res.status(200).json({
      status: 'success',
      message: 'Profile details updated successfully in database.',
      data: {
        user: updatedUser,
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
};
