import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

/**
 * Rate limiter for authentication routes (signup, login)
 * 10 requests per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: () => env.isTest,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

/**
 * Rate limiter for image generation route
 * 5 requests per minute per user
 */
export const generateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  skip: () => env.isTest,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by authenticated user ID if available, otherwise by IP
    return req.user?.id || req.ip;
  },
  message: {
    success: false,
    message: 'Rate limit exceeded: You can only generate up to 5 images per minute. Please try again shortly.',
  },
});
