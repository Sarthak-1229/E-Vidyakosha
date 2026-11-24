// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../App';
import { mockAdapter } from '../api/mockAdapter';
import { setAuthToken } from '../api/client';

const fixturePassword = crypto.randomUUID();

describe('Role-based Navigation & Route Protection (FR-02, RBAC)', () => {
  beforeEach(() => {
    setAuthToken(null);
    mockAdapter.reset(fixturePassword);
  });

  it('redirects unauthenticated users to /sign-in when accessing protected library', async () => {
    render(
      <MemoryRouter initialEntries={['/library']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Welcome back\./i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Sign In$/i })).toBeInTheDocument();
    });
  });

  it('blocks student role from accessing faculty upload route with Access Restricted page', async () => {
    // Authenticate as STUDENT
    setAuthToken(crypto.randomUUID());
    mockAdapter.setCurrentUser({
      id: '674391a10000000000000001',
      name: 'Fixture Student',
      email: 'student.fixture@mitaoe.ac.in',
      role: 'STUDENT',
      createdAt: '2026-10-15T09:00:00.000Z',
    });

    render(
      <MemoryRouter initialEntries={['/faculty/upload']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Access Restricted/i)).toBeInTheDocument();
      expect(screen.getByText('STUDENT', { selector: 'strong' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Return to Library/i })).toBeInTheDocument();
    });
  });

  it('blocks faculty role from accessing admin review queue with Access Restricted page', async () => {
    // Authenticate as FACULTY
    setAuthToken(crypto.randomUUID());
    mockAdapter.setCurrentUser({
      id: '674391a10000000000000002',
      name: 'Fixture Faculty',
      email: 'faculty.fixture@example.test',
      role: 'FACULTY',
      createdAt: '2026-09-01T10:30:00.000Z',
    });

    render(
      <MemoryRouter initialEntries={['/admin/approvals']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Access Restricted/i)).toBeInTheDocument();
      expect(screen.getByText('FACULTY', { selector: 'strong' })).toBeInTheDocument();
    });
  });

  it('renders 404 page for nonexistent routes', async () => {
    render(
      <MemoryRouter initialEntries={['/nonexistent-route-path']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Page Not Found/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Return to Home/i })).toBeInTheDocument();
    });
  });
});
