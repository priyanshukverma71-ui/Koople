import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const { isAuthenticated } = useAuth();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 4rem - 12rem)',
        padding: 'var(--space-8) var(--space-4)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '4.5rem',
          height: '4.5rem',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--color-primary-light)',
          color: 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 'var(--space-4)',
        }}
      >
        <Sparkles size={36} />
      </div>

      <h1
        style={{
          fontSize: '4.5rem',
          fontWeight: 800,
          fontFamily: 'var(--font-mono)',
          lineHeight: 1,
          color: 'var(--color-text)',
          marginBottom: 'var(--space-2)',
        }}
      >
        404
      </h1>

      <h2
        style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'var(--color-text)',
          marginBottom: 'var(--space-2)',
        }}
      >
        Page Not Found
      </h2>

      <p
        style={{
          fontSize: '1rem',
          color: 'var(--color-text-secondary)',
          maxWidth: '440px',
          marginBottom: 'var(--space-6)',
          lineHeight: 1.5,
        }}
      >
        The page you are looking for does not exist or may have been moved.
      </p>

      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <Link to="/" className="btn btn-secondary">
          <ArrowLeft size={16} />
          <span>Home</span>
        </Link>
        {isAuthenticated && (
          <Link to="/dashboard" className="btn btn-primary">
            <span>Go to Studio</span>
          </Link>
        )}
      </div>
    </div>
  );
}
