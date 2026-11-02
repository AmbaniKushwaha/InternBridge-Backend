import { StudentProfile } from '../models/StudentProfile.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

export const getAllStudents = async (req, res, next) => {
  try {
    const { skill, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (skill) {
      filter.selfReportedSkills = { $regex: skill, $options: 'i' };
    }

    if (search) {
      filter.$or = [
        { college: { $regex: search, $options: 'i' } },
        { course: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
        { selfReportedSkills: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const students = await StudentProfile.find(filter)
      .populate('user', 'name avatar email')
      .skip(skip)
      .limit(Number(limit));

    const total = await StudentProfile.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: students.length,
      total,
      data: { students },
    });
  } catch (error) {
    next(error);
  }
};

export const getStudentById = async (req, res, next) => {
  try {
    const student = await StudentProfile.findById(req.params.id).populate('user', 'name avatar email');
    if (!student) {
      return next(new AppError('Student profile not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { student },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
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

    // 1. Update User
    const userUpdate = {};
    if (name && name.trim()) userUpdate.name = name.trim();
    if (avatar !== undefined) userUpdate.avatar = avatar;

    let updatedUser = null;
    if (Object.keys(userUpdate).length > 0) {
      updatedUser = await User.findByIdAndUpdate(req.user._id, userUpdate, {
        new: true,
        runValidators: true,
      });
    }

    // 2. Find or create StudentProfile
    let studentProfile = await StudentProfile.findOne({ user: req.user._id });

    const formattedSkills = selfReportedSkills !== undefined
      ? (Array.isArray(selfReportedSkills)
          ? selfReportedSkills
          : String(selfReportedSkills).split(',').map((s) => s.trim()).filter(Boolean))
      : undefined;

    const formattedInterests = interests !== undefined
      ? (Array.isArray(interests)
          ? interests
          : String(interests).split(',').map((s) => s.trim()).filter(Boolean))
      : undefined;

    const updateFields = {
      college: college !== undefined ? college : studentProfile?.college || '',
      course: course !== undefined ? course : studentProfile?.course || '',
      graduationYear: graduationYear ? Number(graduationYear) : studentProfile?.graduationYear || 2026,
      bio: bio !== undefined ? bio : studentProfile?.bio || '',
      selfReportedSkills: formattedSkills !== undefined ? formattedSkills : studentProfile?.selfReportedSkills || [],
      interests: formattedInterests !== undefined ? formattedInterests : studentProfile?.interests || [],
      availability: availability || studentProfile?.availability || '15-25 hrs/week',
      preferredArrangement: preferredArrangement || studentProfile?.preferredArrangement || 'Remote',
      experienceLevel: experienceLevel || studentProfile?.experienceLevel || 'Intermediate',
      githubUrl: githubUrl !== undefined ? githubUrl : studentProfile?.githubUrl || '',
      linkedinUrl: linkedinUrl !== undefined ? linkedinUrl : studentProfile?.linkedinUrl || '',
      websiteUrl: websiteUrl !== undefined ? websiteUrl : studentProfile?.websiteUrl || '',
    };

    if (!studentProfile) {
      studentProfile = await StudentProfile.create({
        user: req.user._id,
        ...updateFields,
      });
    } else {
      Object.assign(studentProfile, updateFields);
      await studentProfile.save();
    }

    await studentProfile.populate('user', 'name avatar email');

    res.status(200).json({
      status: 'success',
      message: 'Student profile updated successfully in database.',
      data: {
        student: studentProfile,
        user: updatedUser || studentProfile.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const addPortfolioItem = async (req, res, next) => {
  try {
    const studentProfile = await StudentProfile.findOne({ user: req.user._id });
    if (!studentProfile) return next(new AppError('Profile not found', 404));

    studentProfile.portfolioItems.unshift(req.body);
    await studentProfile.save();

    res.status(201).json({
      status: 'success',
      data: {
        portfolioItems: studentProfile.portfolioItems,
        portfolioItem: studentProfile.portfolioItems[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updatePortfolioItem = async (req, res, next) => {
  try {
    const studentProfile = await StudentProfile.findOne({ user: req.user._id });
    if (!studentProfile) return next(new AppError('Profile not found', 404));

    const item = studentProfile.portfolioItems.id(req.params.itemId);
    if (!item) return next(new AppError('Portfolio item not found', 404));

    Object.assign(item, req.body);
    await studentProfile.save();

    res.status(200).json({
      status: 'success',
      data: {
        portfolioItem: item,
        portfolioItems: studentProfile.portfolioItems,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deletePortfolioItem = async (req, res, next) => {
  try {
    const studentProfile = await StudentProfile.findOne({ user: req.user._id });
    if (!studentProfile) return next(new AppError('Profile not found', 404));

    studentProfile.portfolioItems = studentProfile.portfolioItems.filter(
      (item) => item._id.toString() !== req.params.itemId
    );
    await studentProfile.save();

    res.status(200).json({
      status: 'success',
      data: { portfolioItems: studentProfile.portfolioItems },
    });
  } catch (error) {
    next(error);
  }
};
