import React, { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Menu, X, LogOut, Clock, PlusCircle, User } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const scrollToFeatures = (e) => {
    closeMobileMenu();
    if (location.pathname === '/') {
      e.preventDefault();
      const el = document.getElementById('features');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/#features');
    }
  };

  return (
    <header className="navbar-header">
      <div className="container navbar-container">
        {/* Brand Logo */}
        <Link
          to={isAuthenticated ? '/dashboard' : '/'}
          className="navbar-brand"
          onClick={closeMobileMenu}
        >
          <div className="navbar-logo-icon">
            <Sparkles size={20} />
          </div>
          <span className="navbar-brand-name">KOOPLE</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="navbar-nav desktop-only" aria-label="Main Navigation">
          {isAuthenticated ? (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''}`
                }
              >
                <PlusCircle size={16} />
                <span>Create</span>
              </NavLink>

              <NavLink
                to="/history"
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''}`
                }
              >
                <Clock size={16} />
                <span>History</span>
              </NavLink>

              <div className="navbar-user-section">
                <div className="user-badge" title={user?.email || 'User'}>
                  <div className="user-avatar">
                    <User size={14} />
                  </div>
                  <span className="user-name">{user?.name || user?.email?.split('@')[0] || 'Creator'}</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="btn btn-ghost btn-sm logout-btn"
                  title="Sign out"
                >
                  <LogOut size={16} />
                  <span>Log Out</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `nav-link ${isActive && location.hash !== '#features' ? 'active' : ''}`
                }
              >
                Home
              </NavLink>

              <a
                href="#features"
                onClick={scrollToFeatures}
                className="nav-link"
              >
                Features
              </a>

              <div className="auth-buttons">
                <Link to="/login" className="btn btn-ghost">
                  Log In
                </Link>
                <Link to="/signup" className="btn btn-primary">
                  Sign Up
                </Link>
              </div>
            </>
          )}
        </nav>

        {/* Mobile menu toggle button */}
        <button
          className="mobile-toggle-btn mobile-only"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav Overlay/Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={closeMobileMenu}>
          <div
            className="mobile-menu"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="mobile-menu-links">
              {isAuthenticated ? (
                <>
                  <div className="mobile-user-info">
                    <div className="user-avatar">
                      <User size={18} />
                    </div>
                    <div>
                      <div className="mobile-user-name">{user?.name || 'Creator'}</div>
                      <div className="mobile-user-email">{user?.email || ''}</div>
                    </div>
                  </div>

                  <Link
                    to="/dashboard"
                    className="mobile-nav-link"
                    onClick={closeMobileMenu}
                  >
                    <PlusCircle size={18} />
                    <span>Create Image</span>
                  </Link>

                  <Link
                    to="/history"
                    className="mobile-nav-link"
                    onClick={closeMobileMenu}
                  >
                    <Clock size={18} />
                    <span>Generation History</span>
                  </Link>

                  <div className="mobile-divider"></div>

                  <button
                    onClick={() => {
                      closeMobileMenu();
                      handleLogout();
                    }}
                    className="mobile-nav-link mobile-logout-btn"
                  >
                    <LogOut size={18} />
                    <span>Log Out</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/"
                    className="mobile-nav-link"
                    onClick={closeMobileMenu}
                  >
                    Home
                  </Link>
                  <a
                    href="#features"
                    className="mobile-nav-link"
                    onClick={scrollToFeatures}
                  >
                    Features
                  </a>

                  <div className="mobile-divider"></div>

                  <Link
                    to="/login"
                    className="btn btn-secondary mobile-btn"
                    onClick={closeMobileMenu}
                  >
                    Log In
                  </Link>
                  <Link
                    to="/signup"
                    className="btn btn-primary mobile-btn"
                    onClick={closeMobileMenu}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
