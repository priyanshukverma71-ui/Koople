import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="page-loader" role="status" aria-label="Loading session">
        <div className="spinner spinner-lg"></div>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
          Loading KOOPLE...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page and preserve where the user was trying to go
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
