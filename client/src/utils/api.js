const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Fetch wrapper for KOOPLE API calls
 * Automatically handles credentials, JSON parsing, and error status
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...options.headers,
  };

  const config = {
    credentials: 'include', // Send cookies for auth
    ...options,
    headers,
  };

  if (options.body && typeof options.body === 'object' && !isFormData) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw {
      status: response.status,
      message: data.message || (response.status === 404 ? 'Resource not found' : 'Something went wrong'),
      data,
    };
  }

  return data;
}

export default apiRequest;
