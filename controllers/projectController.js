import { Project } from '../models/Project.js';
import { BusinessProfile } from '../models/BusinessProfile.js';
import { AppError } from '../utils/AppError.js';

export const getAllProjects = async (req, res, next) => {
  try {
    const { category, minBudget, maxBudget, status, arrangement, search, page = 1, limit = 50 } = req.query;

    const filter = {};

    if (status && status.toLowerCase() !== 'all') {
      filter.status = status;
    }

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (arrangement && arrangement !== 'All') {
      filter.arrangement = arrangement;
    }

    if (minBudget || maxBudget) {
      filter.budgetAmount = {};
      if (minBudget) filter.budgetAmount.$gte = Number(minBudget);
      if (maxBudget) filter.budgetAmount.$lte = Number(maxBudget);
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
        { requiredSkills: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate({
          path: 'business',
          select: 'companyName businessType location isVerified user',
          populate: { path: 'user', select: 'avatar name' },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Project.countDocuments(filter),
    ]);

    res.status(200).json({
      status: 'success',
      results: projects.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      data: { projects },
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate({
        path: 'business',
        select: 'companyName businessType description websiteUrl location contactPerson isVerified user',
        populate: { path: 'user', select: 'avatar name email' },
      });

    if (!project) {
      return next(new AppError('No project found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

export const createProject = async (req, res, next) => {
  try {
    const businessProfile = await BusinessProfile.findOne({ user: req.user._id });
    if (!businessProfile) {
      return next(new AppError('Business profile not found for this account.', 404));
    }

    const {
      title,
      category,
      budgetAmount,
      durationWeeks,
      shortDescription,
      fullDescription,
      deliverables,
      requiredSkills,
      arrangement,
    } = req.body;

    const newProject = await Project.create({
      business: businessProfile._id,
      businessUser: req.user._id,
      title,
      category,
      budgetAmount,
      durationWeeks,
      shortDescription,
      fullDescription,
      deliverables: deliverables || [],
      requiredSkills: requiredSkills || [],
      arrangement: arrangement || 'Remote',
      status: 'Open',
    });

    await newProject.populate({
      path: 'business',
      select: 'companyName businessType location isVerified user',
      populate: { path: 'user', select: 'avatar name' },
    });

    res.status(201).json({
      status: 'success',
      data: { project: newProject },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProjectStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return next(new AppError('No project found with that ID', 404));
    }

    // Verify ownership
    if (project.businessUser.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to modify this project.', 403));
    }

    project.status = status;
    await project.save();

    await project.populate({
      path: 'business',
      select: 'companyName businessType location isVerified user',
      populate: { path: 'user', select: 'avatar name' },
    });

    res.status(200).json({
      status: 'success',
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyProjects = async (req, res, next) => {
  try {
    const businessProfile = await BusinessProfile.findOne({ user: req.user._id });
    const filter = {
      $or: [
        { businessUser: req.user._id },
        ...(businessProfile ? [{ business: businessProfile._id }] : []),
      ],
    };

    const projects = await Project.find(filter)
      .populate({
        path: 'business',
        select: 'companyName businessType location isVerified user',
        populate: { path: 'user', select: 'avatar name' },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: projects.length,
      data: { projects },
    });
  } catch (error) {
    next(error);
  }
};
