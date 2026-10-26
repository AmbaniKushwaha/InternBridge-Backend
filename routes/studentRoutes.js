import { Router } from 'express';
import {
  getAllStudents,
  getStudentById,
  updateProfile,
  addPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
} from '../controllers/studentController.js';
import { protect, restrictTo } from '../middlewares/auth.js';

export const studentRouter = Router();

// Public discovery
studentRouter.get('/', getAllStudents);
studentRouter.get('/:id', getStudentById);

// Protected student profile management
studentRouter.use(protect);
studentRouter.put('/profile', restrictTo('student'), updateProfile);
studentRouter.post('/portfolio', restrictTo('student'), addPortfolioItem);
studentRouter.put('/portfolio/:itemId', restrictTo('student'), updatePortfolioItem);
studentRouter.delete('/portfolio/:itemId', restrictTo('student'), deletePortfolioItem);
