import { Router } from 'express';
import { register, login, refresh, logout, getMe, updateProfile } from '../controllers/authController.js';
import { protect, optionalAuth } from '../middlewares/auth.js';

export const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/refresh', refresh);
authRouter.post('/logout', optionalAuth, logout);
authRouter.get('/me', protect, getMe);
authRouter.put('/profile', protect, updateProfile);
