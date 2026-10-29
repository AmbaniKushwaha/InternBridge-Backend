import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { AppError } from './utils/AppError.js';
import { errorHandler } from './middlewares/errorHandler.js';

// Route Imports
import { authRouter } from './routes/authRoutes.js';
import { projectRouter } from './routes/projectRoutes.js';
import { applicationRouter } from './routes/applicationRoutes.js';
import { teamRouter } from './routes/teamRoutes.js';
import { studentRouter } from './routes/studentRoutes.js';
import { businessRouter } from './routes/businessRoutes.js';
import { notificationRouter } from './routes/notificationRoutes.js';
import { uploadRouter } from './routes/uploadRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// Security HTTP headers with cross-origin resource policy enabled for uploads
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS Configuration
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:3000';
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        origin === allowedOrigin ||
        /^http:\/\/localhost:\d+$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parsers (allow up to 10mb for image uploads & base64)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'InternBridge API Server is healthy and running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Mount Feature API Routers
app.use('/api/auth', authRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/projects', projectRouter);
app.use('/api/applications', applicationRouter);
app.use('/api/teams', teamRouter);
app.use('/api/students', studentRouter);
app.use('/api/businesses', businessRouter);
app.use('/api/notifications', notificationRouter);

// Handle unhandled routes (404)
app.all('/api/*', (req, res, next) => {
  next(new AppError(`Cannot find endpoint ${req.originalUrl} on this server`, 404));
});

// Global Centralized Error Handling Middleware
app.use(errorHandler);
