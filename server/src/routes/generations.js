import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/validate.js';
import { Generation } from '../models/Generation.js';
import { apiResponse } from '../utils/apiResponse.js';

const router = Router();

/**
 * GET /api/generations
 * Retrieve paginated history of image generations for authenticated user (metadata only, no imageData)
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const [generations, total] = await Promise.all([
      Generation.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Generation.countDocuments({ userId }),
    ]);

    const formattedGenerations = generations.map((g) => ({
      id: g._id.toString(),
      prompt: g.prompt,
      model: g.model,
      aspectRatio: g.aspectRatio,
      imageData: g.imageData,
      mimeType: g.mimeType,
      status: g.status,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    }));

    return apiResponse.success(res, {
      generations: formattedGenerations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/generations/:id
 * Retrieve a single image generation with complete base64 imageData
 */
router.get('/:id', authenticate, validateObjectId('id'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const generation = await Generation.findById(id);
    if (!generation) {
      return apiResponse.error(res, 'Generation not found', 404);
    }

    // Verify ownership
    if (generation.userId.toString() !== userId) {
      return apiResponse.error(res, 'You do not have permission to view this generation', 403);
    }

    return apiResponse.success(res, {
      generation: {
        id: generation._id.toString(),
        prompt: generation.prompt,
        model: generation.model,
        aspectRatio: generation.aspectRatio,
        imageData: generation.imageData,
        mimeType: generation.mimeType,
        status: generation.status,
        createdAt: generation.createdAt,
      },
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * DELETE /api/generations/:id
 * Delete an image generation
 */
router.delete('/:id', authenticate, validateObjectId('id'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const generation = await Generation.findById(id);
    if (!generation) {
      return apiResponse.error(res, 'Generation not found', 404);
    }

    // Verify ownership
    if (generation.userId.toString() !== userId) {
      return apiResponse.error(res, 'You do not have permission to delete this generation', 403);
    }

    await generation.deleteOne();

    return apiResponse.success(res, {
      message: 'Generation deleted successfully',
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
