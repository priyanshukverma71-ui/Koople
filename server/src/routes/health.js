import { Router } from 'express';
import { isDBConnected } from '../config/db.js';

const router = Router();

/**
 * GET /api/health
 * System health check endpoint
 */
router.get('/', (req, res) => {
  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: isDBConnected() ? 'connected' : 'disconnected',
  });
});

export default router;
