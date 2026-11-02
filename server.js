import 'dotenv/config';
import { app } from './app.js';
import { connectDB } from './config/db.js';
import { validateAuthEnvironment } from './utils/tokenUtils.js';

import dns from "dns"
dns.setServers(["8.8.8.8", "1.1.1.1"]);

// Validate required authentication environment variables
validateAuthEnvironment();

// Catch uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION] Shutting down...', err.name, err.message);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
await connectDB();

const server = app.listen(PORT, () => {
  console.log(`InternBridge Backend running on http://localhost:${PORT} [${process.env.NODE_ENV || 'development'}]`);
  
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('[UNHANDLED REJECTION] Shutting down gracefully...', err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
