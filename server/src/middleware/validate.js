import mongoose from 'mongoose';
import { apiResponse } from '../utils/apiResponse.js';

/**
 * Middleware factory to validate request parts using Zod schemas
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @param {'body' | 'query' | 'params'} source - Part of request to validate (default: 'body')
 */
export function validate(schema, source = 'body') {
  return async (req, res, next) => {
    try {
      const parsed = await schema.parseAsync(req[source]);
      req[source] = parsed;
      return next();
    } catch (error) {
      if (error.errors) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return apiResponse.error(res, formattedErrors[0]?.message || 'Validation error', 400, formattedErrors);
      }
      return apiResponse.error(res, error.message || 'Validation error', 400);
    }
  };
}

/**
 * Middleware to validate MongoDB ObjectId route parameters
 * @param {string} paramName - Name of the route parameter to check (default: 'id')
 */
export function validateObjectId(paramName = 'id') {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return apiResponse.error(res, `Invalid ID format for parameter: '${paramName}'`, 400);
    }
    return next();
  };
}
