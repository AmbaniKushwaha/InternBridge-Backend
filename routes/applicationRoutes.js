import { Router } from 'express';
import {
  applyToProject,
  getMyApplications,
  getProjectApplicants,
  updateApplicationStatus,
} from '../controllers/applicationController.js';
import { protect, restrictTo } from '../middlewares/auth.js';

export const applicationRouter = Router();

applicationRouter.use(protect);

applicationRouter.post('/', restrictTo('student'), applyToProject);
applicationRouter.get('/my', restrictTo('student', 'business'), getMyApplications);
applicationRouter.get('/project/:projectId', restrictTo('business', 'admin'), getProjectApplicants);
applicationRouter.patch('/:id/status', restrictTo('business', 'admin'), updateApplicationStatus);
