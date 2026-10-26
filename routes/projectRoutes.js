import { Router } from 'express';
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProjectStatus,
  getMyProjects,
} from '../controllers/projectController.js';
import { protect, restrictTo } from '../middlewares/auth.js';

export const projectRouter = Router();

// Public routes
projectRouter.get('/', getAllProjects);
projectRouter.get('/:id', getProjectById);

// Protected business routes
projectRouter.use(protect);
projectRouter.post('/', restrictTo('business'), createProject);
projectRouter.get('/my/listed', restrictTo('business'), getMyProjects);
projectRouter.patch('/:id/status', restrictTo('business', 'admin'), updateProjectStatus);
