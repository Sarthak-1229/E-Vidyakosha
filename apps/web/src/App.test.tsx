// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';
import { mockAdapter } from './api';

describe('Authentication & Registration Flows (FR-01, FR-02)', () => {
  beforeEach(() => {
    mockAdapter.reset();
  });

  it('renders landing page with E-Vidyakosha branding and navigation', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: 'E-Vidyakosha home' })).toBeInTheDocument();
    expect(screen.getByText(/Knowledge,/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Explore Library/i })).toBeInTheDocument();
  });

  it('FR-01: validates student registration email domain (@mitaoe.ac.in)', async () => {
    render(
      <MemoryRouter initialEntries={['/register']}>
        <App />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: 'Test Student' },
    });
    fireEvent.change(screen.getByLabelText(/Institutional Email/i), {
      target: { value: 'student@gmail.com' }, // Invalid domain
    });
    fireEvent.change(screen.getByLabelText(/^Password/i), {
      target: { value: 'Password123!' },
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: 'Password123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Create Student Account/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Institutional email must end with @mitaoe.ac.in/i)
      ).toBeInTheDocument();
    });
  });

  it('FR-01 & D-07: successfully registers student without auto-login and prompts for sign in', async () => {
    render(
      <MemoryRouter initialEntries={['/register']}>
        <App />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: 'Priya Sharma' },
    });
    fireEvent.change(screen.getByLabelText(/Institutional Email/i), {
      target: { value: 'priya.sharma@mitaoe.ac.in' },
    });
    fireEvent.change(screen.getByLabelText(/^Password/i), {
      target: { value: 'Password123!' },
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: 'Password123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Create Student Account/i }));

    await waitFor(() => {
      expect(screen.getByText(/Account Created!/i)).toBeInTheDocument();
      expect(screen.getByText(/Priya Sharma/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Proceed to Sign In/i })).toBeInTheDocument();
    });
  });

  it('FR-02: shows generic error message on invalid credentials', async () => {
    render(
      <MemoryRouter initialEntries={['/sign-in']}>
        <App />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Institutional Email/i), {
      target: { value: 'student@mitaoe.ac.in' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'WrongPassword999' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^Sign In$/i }));

    await waitFor(() => {
      expect(screen.getByText(/Invalid email or password/i)).toBeInTheDocument();
    });
  });

  it('FR-02: logs in student and navigates to the academic library', async () => {
    render(
      <MemoryRouter initialEntries={['/sign-in']}>
        <App />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Institutional Email/i), {
      target: { value: 'student@mitaoe.ac.in' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'Password123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^Sign In$/i }));

    await waitFor(() => {
      expect(screen.getByText(/Academic Library/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Aditi Deshmukh/i).length).toBeGreaterThan(0);
    });
  });
});
