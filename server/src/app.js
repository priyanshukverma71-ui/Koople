import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { corsMiddleware } from './config/cors.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/auth.js';
import generateRoutes from './routes/generate.js';
import generationsRoutes from './routes/generations.js';
import healthRoutes from './routes/health.js';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(corsMiddleware);

// Cookie parser for JWT cookie authentication
app.use(cookieParser());

// Body parsing with 10mb limit for base64 image data
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount API routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', generateRoutes);
app.use('/api/generations', generationsRoutes);

// Fallback 404 handler
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

export default app;
