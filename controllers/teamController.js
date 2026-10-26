import { Team } from '../models/Team.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { Notification } from '../models/Notification.js';
import { AppError } from '../utils/AppError.js';

export const getAllTeams = async (req, res, next) => {
  try {
    const teams = await Team.find()
      .populate({
        path: 'leader',
        select: 'user college course bio',
        populate: { path: 'user', select: 'name avatar email' },
      })
      .populate({
        path: 'members.student',
        populate: { path: 'user', select: 'name avatar email' },
      })
      .populate({
        path: 'pendingJoinRequests.student',
        populate: { path: 'user', select: 'name avatar' },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: teams.length,
      data: { teams },
    });
  } catch (error) {
    next(error);
  }
};

export const getTeamById = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate({
        path: 'leader',
        select: 'user college course bio',
        populate: { path: 'user', select: 'name avatar email' },
      })
      .populate({
        path: 'members.student',
        populate: { path: 'user', select: 'name avatar email' },
      })
      .populate({
        path: 'pendingJoinRequests.student',
        populate: { path: 'user', select: 'name avatar' },
      });

    if (!team) {
      return next(new AppError('Team not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { team },
    });
  } catch (error) {
    next(error);
  }
};

export const createTeam = async (req, res, next) => {
  try {
    const studentProfile = await StudentProfile.findOne({ user: req.user._id });
    if (!studentProfile) {
      return next(new AppError('Student profile required to create a team.', 404));
    }

    const { name, description, avatar, projectInterests, combinedSkills, openPositions, visibility } = req.body;

    const allSkills = Array.from(
      new Set([...(studentProfile.selfReportedSkills || []), ...(combinedSkills || [])])
    );

    const newTeam = await Team.create({
      name,
      description: description || '',
      avatar: avatar || req.user.avatar,
      leader: studentProfile._id,
      combinedSkills: allSkills,
      projectInterests: projectInterests || [],
      openPositions: openPositions || [],
      visibility: visibility || 'Public (Discoverable by Businesses & Students)',
      members: [
        {
          student: studentProfile._id,
          role: 'Team Leader',
          isLeader: true,
        },
      ],
    });

    await newTeam.populate([
      {
        path: 'leader',
        select: 'user college course bio',
        populate: { path: 'user', select: 'name avatar email' },
      },
      {
        path: 'members.student',
        populate: { path: 'user', select: 'name avatar email' },
      },
    ]);

    res.status(201).json({
      status: 'success',
      data: { team: newTeam },
    });
  } catch (error) {
    next(error);
  }
};

export const requestToJoin = async (req, res, next) => {
  try {
    const studentProfile = await StudentProfile.findOne({ user: req.user._id });
    const team = await Team.findById(req.params.id).populate('leader');

    if (!team) return next(new AppError('Team not found', 404));

    // Check if already member
    if (team.members.some((m) => m.student.toString() === studentProfile._id.toString())) {
      return next(new AppError('You are already a member of this team.', 400));
    }

    // Check if already requested
    if (team.pendingJoinRequests.some((r) => r.student.toString() === studentProfile._id.toString())) {
      return next(new AppError('Your join request is already pending.', 400));
    }

    team.pendingJoinRequests.push({ student: studentProfile._id });
    await team.save();

    // Notify team leader
    await Notification.create({
      recipient: team.leader.user,
      title: 'New Team Join Request',
      message: `${req.user.name} requested to join "${team.name}".`,
      type: 'team',
      link: `/student/teams/${team._id}`,
    });

    res.status(200).json({
      status: 'success',
      message: 'Join request sent successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const respondToJoinRequest = async (req, res, next) => {
  try {
    const { studentId, accept } = req.body;
    const studentProfile = await StudentProfile.findOne({ user: req.user._id });
    const team = await Team.findById(req.params.id);

    if (!team) return next(new AppError('Team not found', 404));

    // Verify leader
    if (team.leader.toString() !== studentProfile._id.toString()) {
      return next(new AppError('Only the team leader can respond to requests.', 403));
    }

    team.pendingJoinRequests = team.pendingJoinRequests.filter(
      (r) => r.student.toString() !== studentId
    );

    if (accept) {
      const applicantProfile = await StudentProfile.findById(studentId);
      if (applicantProfile) {
        team.members.push({
          student: applicantProfile._id,
          role: 'Team Contributor',
          isLeader: false,
        });
        team.combinedSkills = Array.from(
          new Set([...team.combinedSkills, ...(applicantProfile.selfReportedSkills || [])])
        );
      }
    }

    await team.save();

    res.status(200).json({
      status: 'success',
      data: { team },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyTeams = async (req, res, next) => {
  try {
    const studentProfile = await StudentProfile.findOne({ user: req.user._id });
    if (!studentProfile) return next(new AppError('Student profile not found', 404));

    const teams = await Team.find({
      'members.student': studentProfile._id,
    })
      .populate({
        path: 'leader',
        select: 'user college course bio',
        populate: { path: 'user', select: 'name avatar email' },
      })
      .populate({
        path: 'members.student',
        populate: { path: 'user', select: 'name avatar email' },
      })
      .populate({
        path: 'pendingJoinRequests.student',
        populate: { path: 'user', select: 'name avatar' },
      });

    res.status(200).json({
      status: 'success',
      results: teams.length,
      data: { teams },
    });
  } catch (error) {
    next(error);
  }
};
