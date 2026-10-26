import { Router } from 'express';
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../controllers/notificationController.js';
import { protect } from '../middlewares/auth.js';

export const notificationRouter = Router();

notificationRouter.use(protect);
notificationRouter.get('/', getMyNotifications);
notificationRouter.get('/my', getMyNotifications);
notificationRouter.patch('/:id/read', markNotificationRead);
notificationRouter.patch('/mark-all-read', markAllNotificationsRead);
