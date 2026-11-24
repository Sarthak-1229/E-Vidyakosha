// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../App';
import { mockAdapter } from '../api/mockAdapter';
import { setAuthToken } from '../api/client';

const fixturePassword = crypto.randomUUID();

describe('Admin Management & Approvals (FR-03, FR-04, FR-05)', () => {
  beforeEach(() => {
    setAuthToken(null);
    mockAdapter.reset(fixturePassword);
    setAuthToken(crypto.randomUUID());
    mockAdapter.setCurrentUser({
      id: '674391a10000000000000003',
      name: 'System Administrator',
      email: 'admin.fixture@example.test',
      role: 'ADMIN',
      createdAt: '2026-08-01T08:00:00.000Z',
    });
  });

  it('FR-05: renders review & approvals queue with pending documents', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/approvals']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Review & Approvals Queue/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Introduction to Applied Thermodynamics Handout/i)
      ).toBeInTheDocument();
    });
  });

  it('FR-05: approves a pending document', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/approvals']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Introduction to Applied Thermodynamics Handout/i)
      ).toBeInTheDocument();
    });

    const reviewButtons = screen.getAllByRole('button', { name: /Review Submission/i });
    fireEvent.click(reviewButtons[0]!);

    // Decision modal opens
    await waitFor(() => {
      expect(screen.getByText(/Review Academic Submission/i)).toBeInTheDocument();
    });

    // Click confirm approval button inside modal
    const confirmBtn = screen.getByRole('button', { name: /Confirm Approval/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Submission successfully approved\./i)
      ).toBeInTheDocument();
    });
  });

  it('FR-05: rejects a document requiring a mandatory rejection reason', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/approvals']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Introduction to Applied Thermodynamics Handout/i)
      ).toBeInTheDocument();
    });

    const reviewButtons = screen.getAllByRole('button', { name: /Review Submission/i });
    fireEvent.click(reviewButtons[0]!);

    // Decision modal opens
    await waitFor(() => {
      expect(screen.getByText(/Review Academic Submission/i)).toBeInTheDocument();
    });

    // Switch to rejection mode
    const rejectResource = screen.getByRole('button', { name: /Reject Resource/i });
    fireEvent.click(rejectResource);

    // Try submitting without reason
    const confirmRejectBtn = screen.getByRole('button', { name: /Confirm Rejection/i });
    fireEvent.click(confirmRejectBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/A rejection reason is required\./i)
      ).toBeInTheDocument();
    });

    // Enter a valid rejection reason
    const reasonInput = screen.getByPlaceholderText(/Explain why the submission is rejected/i);
    fireEvent.change(reasonInput, {
      target: { value: 'Syllabus mismatch with current university guidelines.' },
    });

    fireEvent.click(confirmRejectBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Submission successfully rejected\./i)
      ).toBeInTheDocument();
    });
  });

  it('FR-04: renders academic hierarchy and allows department creation', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/academic']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Departments & Subjects/i })
      ).toBeInTheDocument();
      expect(screen.getAllByText(/School of Computer Engineering/i).length).toBeGreaterThan(0);
    });

    // Open Add Department modal (first Add button)
    const addButtons = screen.getAllByRole('button', { name: /Add/i });
    fireEvent.click(addButtons[0]!);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Add Department/i })).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/Department Name/i);
    fireEvent.change(nameInput, { target: { value: 'School of Chemical Sciences' } });

    const submitBtn = screen.getByRole('button', { name: /Create Department/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/created successfully/i)).toBeInTheDocument();
      expect(screen.getAllByText(/School of Chemical Sciences/i).length).toBeGreaterThan(0);
    });
  });

  it('FR-03 & FR-04: renders user accounts list and roles', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/users']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /User Accounts/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/Fixture Student/i)).toBeInTheDocument();
      expect(screen.getByText(/Fixture Faculty/i)).toBeInTheDocument();
      expect(screen.getAllByText(/System Administrator/i).length).toBeGreaterThan(0);
    });
  });
});
