import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check current session on initial load
  const checkSession = useCallback(async () => {
    try {
      const data = await apiRequest('/api/auth/me');
      setUser(data.user || data);
    } catch (err) {
      // 401 or network failure silently treated as unauthenticated
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (email, password) => {
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    const loggedUser = data.user || data;
    setUser(loggedUser);
    return data;
  };

  const signup = async (name, email, password) => {
    const data = await apiRequest('/api/auth/signup', {
      method: 'POST',
      body: { name, email, password },
    });
    const signedUser = data.user || data;
    setUser(signedUser);
    return data;
  };

  const logout = async () => {
    try {
      await apiRequest('/api/auth/logout', {
        method: 'POST',
      });
    } catch (err) {
      console.warn('Logout request completed with error:', err.message);
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    checkSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
