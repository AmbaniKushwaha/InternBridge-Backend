import { Router } from 'express';
import { uploadImage, uploadAvatar } from '../controllers/uploadController.js';
import { optionalAuth } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';

export const uploadRouter = Router();

// Upload any general image (uses optional auth so unauthenticated/demo users can upload too)
uploadRouter.post('/', optionalAuth, upload.single('image'), uploadImage);

// Upload and set user avatar directly
uploadRouter.post('/avatar', optionalAuth, upload.single('avatar'), uploadAvatar);

