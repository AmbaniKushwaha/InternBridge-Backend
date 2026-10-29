import { Router } from 'express';
import { uploadImage, uploadAvatar } from '../controllers/uploadController.js';
import { protect } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';

export const uploadRouter = Router();

// Upload any general image (requires auth)
uploadRouter.post('/', protect, upload.single('image'), uploadImage);

// Upload and set user avatar directly (requires auth)
uploadRouter.post('/avatar', protect, upload.single('avatar'), uploadAvatar);

