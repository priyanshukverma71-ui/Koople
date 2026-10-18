import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Heart } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer-root">
      <div className="container footer-container">
        <div className="footer-top">
          {/* Brand Info */}
          <div className="footer-brand-col">
            <Link to="/" className="footer-brand">
              <div className="footer-logo-icon">
                <Sparkles size={18} />
              </div>
              <span className="footer-brand-name">KOOPLE</span>
            </Link>
            <p className="footer-description">
              Transform ideas into stunning, photorealistic and stylized visuals.
              Engineered with modern AI to inspire artists, creators, and teams.
            </p>
            <div className="footer-attribution">
              <span className="gemini-pill">
                Powered by Google Gemini
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-links-group">
            <div className="footer-col">
              <h4 className="footer-heading">Platform</h4>
              <ul className="footer-nav-list">
                <li><Link to="/">Home</Link></li>
                <li><a href="/#features">Features</a></li>
                <li><Link to="/dashboard">Generate</Link></li>
                <li><Link to="/history">History</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4 className="footer-heading">Product</h4>
              <ul className="footer-nav-list">
                <li><a href="/#how-it-works">How It Works</a></li>
                <li><a href="/#faq">FAQ</a></li>
                <li><a href="/#responsible-ai">Responsible AI</a></li>
                <li><a href="https://ai.google.dev/" target="_blank" rel="noreferrer">Gemini API</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4 className="footer-heading">Legal & Privacy</h4>
              <ul className="footer-nav-list">
                <li><a href="#privacy">Privacy Policy</a></li>
                <li><a href="#terms">Terms of Service</a></li>
                <li><a href="#acceptable-use">Acceptable Use</a></li>
                <li><a href="#security">Security</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copyright">
            © 2024 KOOPLE. All rights reserved.
          </p>
          <p className="footer-tagline">
            Built for creators with high precision AI
          </p>
        </div>
      </div>
    </footer>
  );
}
