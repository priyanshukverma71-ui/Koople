import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

describe('KOOPLE Application Frontend', () => {
  beforeEach(() => {
    // Mock global fetch to return 401 for /api/auth/me by default (unauthenticated)
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({ message: 'Unauthorized' }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({}),
      });
    });
  });

  it('renders landing page with KOOPLE brand header and hero title', async () => {
    render(<App />);

    // Brand name check
    const brandElements = await screen.findAllByText(/KOOPLE/i);
    expect(brandElements.length).toBeGreaterThan(0);

    // Hero title check
    expect(screen.getByRole('heading', { level: 1, name: /Transform Ideas Into/i })).toBeInTheDocument();
    expect(screen.getByText(/Stunning Images/i)).toBeInTheDocument();
  });

  it('displays the features section and how it works', async () => {
    render(<App />);

    expect(screen.getByText(/Engineered for Creative Precision/i)).toBeInTheDocument();
    expect(screen.getByText(/Text-to-Image/i)).toBeInTheDocument();
    expect(screen.getByText(/Multiple Formats/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /How It Works/i })).toBeInTheDocument();
  });

  it('navigates to Login page when clicking Log In', async () => {
    render(<App />);

    const loginLinks = screen.getAllByRole('link', { name: /Log In/i });
    fireEvent.click(loginLinks[0]);

    await waitFor(() => {
      expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Password/i)).toBeInTheDocument();
    });
  });

  it('navigates to Signup page when clicking Sign Up', async () => {
    render(<App />);

    const signupLinks = screen.getAllByRole('link', { name: /Sign Up/i });
    fireEvent.click(signupLinks[0]);

    await waitFor(() => {
      expect(screen.getByText(/Create your account/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
    });
  });

  it('validates required fields on signup submit', async () => {
    render(<App />);

    const signupLinks = screen.getAllByRole('link', { name: /Sign Up/i });
    fireEvent.click(signupLinks[0]);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /Create Account/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Please provide your full name/i)).toBeInTheDocument();
    });
  });
});
