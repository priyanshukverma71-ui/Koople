import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { generateLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { generateImage } from '../services/gemini.js';
import { Generation } from '../models/Generation.js';
import { apiResponse } from '../utils/apiResponse.js';

const router = Router();

const generateSchema = z.object({
  prompt: z
    .string({ required_error: 'Prompt is required' })
    .trim()
    .min(1, 'Prompt cannot be empty')
    .max(2000, 'Prompt cannot exceed 2000 characters'),
  aspectRatio: z
    .enum(['1:1', '3:4', '4:3', '9:16', '16:9'])
    .optional()
    .default('1:1'),
});

/**
 * POST /api/generate-image
 * Generate a new AI image using Gemini Imagen 3
 */
router.post(
  '/generate-image',
  authenticate,
  generateLimiter,
  validate(generateSchema),
  async (req, res, next) => {
    try {
      const { prompt, aspectRatio } = req.body;
      const userId = req.user.id;

      // Call Google Gemini image generation service
      const generated = await generateImage(prompt, aspectRatio);

      // Save generation result to MongoDB
      const generation = await Generation.create({
        userId,
        prompt,
        model: generated.model,
        aspectRatio,
        imageData: generated.imageData,
        mimeType: generated.mimeType,
        status: 'completed',
      });

      return apiResponse.created(res, {
        generation: {
          id: generation._id.toString(),
          prompt: generation.prompt,
          model: generation.model,
          aspectRatio: generation.aspectRatio,
          imageData: generation.imageData,
          mimeType: generation.mimeType,
          createdAt: generation.createdAt,
        },
      });
    } catch (error) {
      return next(error);
    }
  }
);

export default router;
