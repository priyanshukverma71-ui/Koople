import { useState, useCallback } from 'react';
import { apiRequest } from '../utils/api';

/**
 * Custom hook for performing API requests with state management
 */
export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const execute = useCallback(async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiRequest(endpoint, options);
      setData(result);
      return { data: result, error: null };
    } catch (err) {
      const errPayload = {
        status: err.status || 500,
        message: err.message || 'An unexpected error occurred',
        data: err.data || null,
      };
      setError(errPayload);
      return { data: null, error: errPayload };
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    loading,
    error,
    data,
    execute,
    reset,
  };
}

export default useApi;
