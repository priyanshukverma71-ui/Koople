import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { apiResponse } from '../utils/apiResponse.js';

export function authenticate(req, res, next) {
  let token = null;

  // Check HTTP-only cookie first
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // Fallback to Bearer token in Authorization header (convenient for API clients/testing)
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return apiResponse.error(res, 'Authentication required. Please log in.', 401);
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);

    // Attach user identifier and email to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
    };

    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return apiResponse.error(res, 'Session expired. Please log in again.', 401);
    }
    return apiResponse.error(res, 'Invalid authentication token.', 401);
  }
}
