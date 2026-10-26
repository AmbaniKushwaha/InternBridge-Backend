import { Router } from 'express';
import {
  getAllTeams,
  getTeamById,
  createTeam,
  requestToJoin,
  respondToJoinRequest,
  getMyTeams,
} from '../controllers/teamController.js';
import { protect, restrictTo } from '../middlewares/auth.js';

export const teamRouter = Router();

// Public discovery
teamRouter.get('/', getAllTeams);
teamRouter.get('/:id', getTeamById);

// Protected routes
teamRouter.use(protect);
teamRouter.post('/', restrictTo('student'), createTeam);
teamRouter.get('/my/squads', restrictTo('student'), getMyTeams);
teamRouter.post('/:id/join-request', restrictTo('student'), requestToJoin);
teamRouter.post('/:id/respond-request', restrictTo('student'), respondToJoinRequest);
