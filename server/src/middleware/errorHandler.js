import { env } from '../config/env.js';

/**
 * Global centralized error handler for KOOPLE backend.
 */
export function errorHandler(err, req, res, next) {
  // If response has already started sending, delegate to default express handler
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'An unexpected internal server error occurred';
  let details = null;

  // Handle Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for field: ${err.path}`;
  }

  // Handle Mongoose Duplicate Key Error (E11000)
  else if (err.code === 11000) {
    statusCode = 409;
    const duplicateField = Object.keys(err.keyPattern || {})[0] || 'field';
    message = `A record with this ${duplicateField} already exists`;
  }

  // Handle JWT verification errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired';
  }

  // Handle JSON Syntax Error in request body
  else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON in request payload';
  }

  // Sanitize 500 messages in production to prevent leaking internals
  if (statusCode >= 500 && env.isProduction) {
    message = 'An unexpected internal server error occurred. Please try again later.';
  }

  const response = {
    success: false,
    message,
  };

  if (details) {
    response.details = details;
  }

  // Include stack trace only in development/test
  if (!env.isProduction && err.stack) {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
}

/**
 * 404 Route Not Found middleware
 */
export function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    message: `Resource not found on KOOPLE server: ${req.method} ${req.originalUrl}`,
  });
}
