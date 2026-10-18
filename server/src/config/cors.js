import cors from 'cors';
import { env } from './env.js';

export const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, curl, tests)
    if (!origin) {
      return callback(null, true);
    }

    const allowedOrigins = [
      env.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
    ].filter(Boolean);

    if (allowedOrigins.includes(origin) || !env.isProduction) {
      return callback(null, true);
    }

    return callback(new Error(`[KOOPLE CORS] Origin '${origin}' is not permitted by CORS policy`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
};

export const corsMiddleware = cors(corsOptions);
