import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import './Auth.css';

export default function Signup() {
  const { signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    termsAgreed: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear specific field error when typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
    setServerError('');
  };

  const validate = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Please provide your full name.';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters long.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = 'Please provide an email address.';
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!formData.password) {
      errors.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirm your password.';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (!formData.termsAgreed) {
      errors.termsAgreed = 'You must accept the terms of service to create an account.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      await signup(formData.name.trim(), formData.email.trim(), formData.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(
        err.message || 'Unable to register account. Please check your information or try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="auth-logo-link" aria-label="Go to homepage">
            <div className="auth-logo-icon">
              <Sparkles size={20} />
            </div>
            <span className="auth-brand-name">KOOPLE</span>
          </Link>
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Join KOOPLE to start generating stunning AI imagery</p>
        </div>

        {serverError && (
          <div className="alert alert-error" role="alert">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="name-input">
              Full Name
            </label>
            <div className="input-wrapper">
              <span className="input-icon-left">
                <User size={16} />
              </span>
              <input
                id="name-input"
                name="name"
                type="text"
                className={`form-input has-left-icon ${fieldErrors.name ? 'input-error' : ''}`}
                placeholder="Jane Doe"
                value={formData.name}
                onChange={handleChange}
                autoComplete="name"
                required
              />
            </div>
            {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="email-input">
              Email address
            </label>
            <div className="input-wrapper">
              <span className="input-icon-left">
                <Mail size={16} />
              </span>
              <input
                id="email-input"
                name="email"
                type="email"
                className={`form-input has-left-icon ${fieldErrors.email ? 'input-error' : ''}`}
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>
            {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="password-input">
              Password
            </label>
            <div className="input-wrapper">
              <span className="input-icon-left">
                <Lock size={16} />
              </span>
              <input
                id="password-input"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className={`form-input has-left-icon has-right-icon ${fieldErrors.password ? 'input-error' : ''}`}
                placeholder="At least 8 characters"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="input-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="confirm-password-input">
              Confirm Password
            </label>
            <div className="input-wrapper">
              <span className="input-icon-left">
                <Lock size={16} />
              </span>
              <input
                id="confirm-password-input"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                className={`form-input has-left-icon has-right-icon ${fieldErrors.confirmPassword ? 'input-error' : ''}`}
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="input-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <span className="field-error">{fieldErrors.confirmPassword}</span>
            )}
          </div>

          {/* Terms Checkbox */}
          <div className="checkbox-group">
            <input
              id="terms-checkbox"
              name="termsAgreed"
              type="checkbox"
              checked={formData.termsAgreed}
              onChange={handleChange}
            />
            <label htmlFor="terms-checkbox" className="checkbox-label">
              I agree to the <a href="#terms">Terms of Service</a> and acknowledge the{' '}
              <a href="#privacy">Privacy Policy</a>
            </label>
          </div>
          {fieldErrors.termsAgreed && (
            <span className="field-error" style={{ marginTop: '-0.5rem' }}>
              {fieldErrors.termsAgreed}
            </span>
          )}

          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                <span>Creating Account...</span>
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}
