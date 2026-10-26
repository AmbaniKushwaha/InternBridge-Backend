import { Application } from '../models/Application.js';
import { Project } from '../models/Project.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { BusinessProfile } from '../models/BusinessProfile.js';
import { Team } from '../models/Team.js';
import { Notification } from '../models/Notification.js';
import { calculateStudentMatchScore, calculateTeamMatchScore } from '../services/matchingService.js';
import { AppError } from '../utils/AppError.js';

export const applyToProject = async (req, res, next) => {
  try {
    const studentProfile = await StudentProfile.findOne({ user: req.user._id });
    if (!studentProfile) {
      return next(new AppError('Student profile not found for this user.', 404));
    }

    const {
      projectId,
      applicantType,
      teamId,
      proposalText,
      relevantSkills,
      highlightedPortfolioProject,
      availability,
      estimatedTimeline,
      notes,
    } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return next(new AppError('Project not found.', 404));
    }

    if (project.status !== 'Open') {
      return next(new AppError('This project is no longer accepting applications.', 400));
    }

    // Check duplicate application
    let existingAppQuery = { project: project._id, applicantType };
    if (applicantType === 'team') {
      existingAppQuery.team = teamId;
    } else {
      existingAppQuery.student = studentProfile._id;
    }

    const existingApp = await Application.findOne(existingAppQuery);
    if (existingApp) {
      return next(new AppError('You have already submitted an application to this project.', 400));
    }

    // Calculate match score
    let matchScore = 75;
    let matchReasons = [];

    if (applicantType === 'team') {
      const team = await Team.findById(teamId);
      if (!team) return next(new AppError('Team not found', 404));
      const matchResult = calculateTeamMatchScore(project, team);
      matchScore = matchResult.score;
      matchReasons = matchResult.reasons;
    } else {
      const matchResult = calculateStudentMatchScore(project, studentProfile);
      matchScore = matchResult.score;
      matchReasons = matchResult.reasons;
    }

    const application = await Application.create({
      project: project._id,
      business: project.business,
      applicantType,
      student: applicantType === 'individual' ? studentProfile._id : undefined,
      team: applicantType === 'team' ? teamId : undefined,
      proposalText,
      relevantSkills: relevantSkills || studentProfile.selfReportedSkills.slice(0, 5),
      highlightedPortfolioProject: highlightedPortfolioProject || '',
      availability: availability || studentProfile.availability,
      estimatedTimeline: estimatedTimeline || `${project.durationWeeks} weeks`,
      notes: notes || '',
      status: 'Pending',
      matchScore,
      matchReasons,
    });

    // Increment applicantCount on Project
    await Project.findByIdAndUpdate(project._id, { $inc: { applicantCount: 1 } });

    // Send notification to business founder
    await Notification.create({
      recipient: project.businessUser,
      title: 'New Applicant Received',
      message: `A new ${applicantType} application was submitted for "${project.title}".`,
      type: 'application',
      link: `/business/projects/${project._id}/applicants`,
    });

    await application.populate([
      {
        path: 'project',
        select: 'title category budgetAmount durationWeeks status business',
        populate: { path: 'business', select: 'companyName location' },
      },
      {
        path: 'student',
        populate: { path: 'user', select: 'name avatar email' },
      },
      {
        path: 'team',
        populate: { path: 'members.student', populate: { path: 'user', select: 'name avatar' } },
      },
    ]);

    res.status(201).json({
      status: 'success',
      data: { application },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyApplications = async (req, res, next) => {
  try {
    if (req.user.role === 'business') {
      const businessProfile = await BusinessProfile.findOne({ user: req.user._id });
      const filter = {
        $or: [
          { businessUser: req.user._id },
          ...(businessProfile ? [{ business: businessProfile._id }] : []),
        ],
      };
      const myProjects = await Project.find(filter).select('_id');
      const projectIds = myProjects.map((p) => p._id);

      const applications = await Application.find({ project: { $in: projectIds } })
        .populate({
          path: 'project',
          select: 'title category budgetAmount durationWeeks status business',
          populate: { path: 'business', select: 'companyName location' },
        })
        .populate({
          path: 'student',
          populate: { path: 'user', select: 'name avatar email' },
        })
        .populate({
          path: 'team',
          populate: { path: 'members.student', populate: { path: 'user', select: 'name avatar' } },
        })
        .sort({ createdAt: -1 });

      return res.status(200).json({
        status: 'success',
        results: applications.length,
        data: { applications },
      });
    }

    const studentProfile = await StudentProfile.findOne({ user: req.user._id });
    if (!studentProfile) {
      return next(new AppError('Student profile not found.', 404));
    }

    // Find student's own teams
    const userTeams = await Team.find({ 'members.student': studentProfile._id }).select('_id');
    const teamIds = userTeams.map((t) => t._id);

    const applications = await Application.find({
      $or: [
        { student: studentProfile._id, applicantType: 'individual' },
        { team: { $in: teamIds }, applicantType: 'team' },
      ],
    })
      .populate({
        path: 'project',
        select: 'title category budgetAmount durationWeeks status business',
        populate: { path: 'business', select: 'companyName location' },
      })
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name avatar email' },
      })
      .populate({
        path: 'team',
        populate: { path: 'members.student', populate: { path: 'user', select: 'name avatar' } },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: applications.length,
      data: { applications },
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectApplicants = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    const businessProfile = await BusinessProfile.findOne({ user: req.user._id });
    const isOwner =
      req.user.role === 'admin' ||
      (project.businessUser && project.businessUser.toString() === req.user._id.toString()) ||
      (businessProfile && project.business && project.business.toString() === businessProfile._id.toString());

    if (!isOwner) {
      return next(new AppError('Not authorized to view applicants for this project.', 403));
    }

    const applicants = await Application.find({ project: project._id })
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name avatar email' },
      })
      .populate({
        path: 'team',
        populate: { path: 'members.student', populate: { path: 'user', select: 'name avatar' } },
      })
      .sort({ matchScore: -1 });

    res.status(200).json({
      status: 'success',
      results: applicants.length,
      data: { applicants },
    });
  } catch (error) {
    next(error);
  }
};

export const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const application = await Application.findById(req.params.id)
      .populate('project')
      .populate({ path: 'student', populate: { path: 'user', select: '_id' } })
      .populate({ path: 'team', select: 'leader' });

    if (!application) {
      return next(new AppError('Application not found', 404));
    }

    // Verify business ownership
    const businessProfile = await BusinessProfile.findOne({ user: req.user._id });
    const isOwner =
      req.user.role === 'admin' ||
      (application.project.businessUser && application.project.businessUser.toString() === req.user._id.toString()) ||
      (businessProfile && application.project.business && application.project.business.toString() === businessProfile._id.toString());

    if (!isOwner) {
      return next(new AppError('Not authorized to update this application.', 403));
    }

    application.status = status;
    await application.save();

    // If 'Selected', update project status and reject other pending applicants
    if (status === 'Selected') {
      await Project.findByIdAndUpdate(application.project._id, {
        status: 'Selected',
        selectedApplicant: {
          applicantType: application.applicantType,
          student: application.student?._id,
          team: application.team?._id,
        },
      });

      // Mark other pending applicants as Rejected
      await Application.updateMany(
        { project: application.project._id, _id: { $ne: application._id }, status: 'Pending' },
        { status: 'Rejected' }
      );
    }

    // Notify applicant student or team leader
    const targetUserId =
      application.applicantType === 'individual'
        ? application.student?.user?._id
        : application.team?.leader;

    if (targetUserId) {
      await Notification.create({
        recipient: targetUserId,
        title: status === 'Selected' ? '🎉 Application Selected!' : `Application ${status}`,
        message: `Your application for "${application.project.title}" has been marked as ${status}.`,
        type: status === 'Selected' ? 'selection' : 'application',
        link: '/student/applications',
      });
    }

    res.status(200).json({
      status: 'success',
      data: { application },
    });
  } catch (error) {
    next(error);
  }
};
