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
    const studentProfile = await StudentProfile.findOne({ user: req.user._id });
    if (!studentProfile) {
      return next(new AppError('Profile not found', 404));
    }

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

    const userUpdate = {};
    if (name && name.trim()) userUpdate.name = name.trim();
    if (avatar !== undefined) userUpdate.avatar = avatar;

    let updatedUser = null;
    if (Object.keys(userUpdate).length > 0) {
      updatedUser = await User.findByIdAndUpdate(req.user._id, userUpdate, { new: true });
    }

    Object.assign(studentProfile, {
      college: college ?? studentProfile.college,
      course: course ?? studentProfile.course,
      graduationYear: graduationYear ?? studentProfile.graduationYear,
      bio: bio ?? studentProfile.bio,
      selfReportedSkills: selfReportedSkills ?? studentProfile.selfReportedSkills,
      interests: interests ?? studentProfile.interests,
      availability: availability ?? studentProfile.availability,
      preferredArrangement: preferredArrangement ?? studentProfile.preferredArrangement,
      experienceLevel: experienceLevel ?? studentProfile.experienceLevel,
      githubUrl: githubUrl ?? studentProfile.githubUrl,
      linkedinUrl: linkedinUrl ?? studentProfile.linkedinUrl,
      websiteUrl: websiteUrl ?? studentProfile.websiteUrl,
    });

    await studentProfile.save();
    await studentProfile.populate('user', 'name avatar email');

    res.status(200).json({
      status: 'success',
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
