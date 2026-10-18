import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { apiResponse } from '../utils/apiResponse.js';

const router = Router();

const COOKIE_NAME = 'token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};

// Validation Schemas
const signupSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters long')
    .max(100, 'Name cannot exceed 100 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/\d/, 'Password must contain at least one number'),
});

const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

/**
 * POST /api/auth/signup
 * Register a new KOOPLE user
 */
router.post('/signup', authLimiter, validate(signupSchema), async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return apiResponse.error(res, 'An account with this email address already exists', 409);
    }

    // Hash password with 12 rounds
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await User.create({
      name,
      email,
      passwordHash,
    });

    // Generate JWT token (7 days expiry)
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set HTTP-only cookie
    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);

    return apiResponse.created(res, {
      user: user.toSafeObject(),
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/auth/login
 * Log in to KOOPLE account
 */
router.post('/login', authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Intentionally generic message to prevent user enumeration
      return apiResponse.error(res, 'Invalid email or password', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return apiResponse.error(res, 'Invalid email or password', 401);
    }

    // Generate JWT token (7 days expiry)
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set HTTP-only cookie
    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);

    return apiResponse.success(res, {
      user: user.toSafeObject(),
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/auth/logout
 * Log out of KOOPLE account and clear JWT cookie
 */
router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    path: '/',
  });

  return apiResponse.success(res, {
    message: 'Logged out successfully',
  });
});

/**
 * GET /api/auth/me
 * Fetch the authenticated KOOPLE user profile
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return apiResponse.error(res, 'User not found', 404);
    }

    return apiResponse.success(res, {
      user: user.toSafeObject(),
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
