import { Router } from 'express';
import {
  getAllBusinesses,
  getBusinessById,
  updateBusinessProfile,
} from '../controllers/businessController.js';
import { protect, restrictTo } from '../middlewares/auth.js';

export const businessRouter = Router();

// Public discovery
businessRouter.get('/', getAllBusinesses);
businessRouter.get('/:id', getBusinessById);

// Protected business profile management
businessRouter.use(protect);
businessRouter.put('/profile', restrictTo('business'), updateBusinessProfile);
