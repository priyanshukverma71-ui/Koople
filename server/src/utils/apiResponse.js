/**
 * Consistent API response helper methods for KOOPLE server.
 */

export const apiResponse = {
  success(res, data = {}, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      ...data,
    });
  },

  created(res, data = {}) {
    return res.status(201).json({
      success: true,
      ...data,
    });
  },

  error(res, message = 'An unexpected error occurred', statusCode = 500, details = null) {
    const responsePayload = {
      success: false,
      message,
    };

    if (details !== null && details !== undefined) {
      responsePayload.details = details;
    }

    return res.status(statusCode).json(responsePayload);
  },
};
