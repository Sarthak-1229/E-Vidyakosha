// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../App';
import { mockAdapter } from '../api/mockAdapter';
import { setAuthToken } from '../api/client';
import {
  validateEmailInput,
  validatePasswordInput,
  validatePdfFileSync,
  verifyPdfBinaryStructure,
} from '../lib/validation';

const fixturePassword = crypto.randomUUID();

describe('SRS Validation Rules & Console Features (FR-01..FR-12)', () => {
  beforeEach(() => {
    setAuthToken(null);
    mockAdapter.reset(fixturePassword);
  });

  it('validates email format, length caps, and @mitaoe.ac.in boundary', () => {
    expect(validateEmailInput('student@mitaoe.ac.in', { requireInstitution: true })).toBeNull();
    expect(validateEmailInput('@mitaoe.ac.in', { requireInstitution: true })).toBe('Enter a valid email address.');
    expect(validateEmailInput('user@gmail.com', { requireInstitution: true })).toMatch(/@mitaoe\.ac\.in/i);
    expect(validatePasswordInput('short', { minLength: 8 })).toMatch(/at least 8 characters/i);
    expect(validatePasswordInput('a'.repeat(129))).toMatch(/at most 128 characters/i);
  });

  it('rejects empty 0-byte PDF and spoofed non-%PDF binary content client-side', async () => {
    const emptyPdf = new File([], 'empty.pdf', { type: 'application/pdf' });
    expect(validatePdfFileSync(emptyPdf).valid).toBe(false);
    expect(validatePdfFileSync(emptyPdf).error).toMatch(/empty/i);

    const fakePdf = new File(['<html>not actually pdf</html>'], 'spoofed.pdf', {
      type: 'application/pdf',
    });
    const fakeResult = await verifyPdfBinaryStructure(fakePdf);
    expect(fakeResult.valid).toBe(false);
    expect(fakeResult.error).toMatch(/%PDF-/i);

    const realPdf = new File(['%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n'], 'valid.pdf', {
      type: 'application/pdf',
    });
    const realResult = await verifyPdfBinaryStructure(realPdf);
    expect(realResult.valid).toBe(true);
    expect(realResult.checks.signature).toBe(true);
  });

  it('resolves Department and Subject names on Approvals Queue and supports Cards/Table toggle in Library', async () => {
    setAuthToken(crypto.randomUUID());
    mockAdapter.setCurrentUser({
      id: '674391a10000000000000003',
      name: 'System Administrator',
      email: 'admin.fixture@example.test',
      role: 'ADMIN',
      createdAt: '2026-08-01T08:00:00.000Z',
    });

    render(
      <MemoryRouter initialEntries={['/admin/approvals']}>
        <App />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Thermodynamics & Heat Transfer/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/School of Mechanical Engineering/i).length).toBeGreaterThan(0);
    });

    // Navigate to Library via sidebar
    const libraryLinks = screen.getAllByRole('link', { name: /Library/i });
    fireEvent.click(libraryLinks[0]!);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Academic Library/i })).toBeInTheDocument();
    });

    const cardsBtn = screen.getByRole('button', { name: /Cards/i });
    fireEvent.click(cardsBtn);
    await waitFor(() => {
      expect(cardsBtn).toHaveAttribute('aria-pressed', 'true');
    });
  });

  it('UC-09/UC-10/UC-E7: filters Library and Admin Documents accurately when only a Department is selected', async () => {
    setAuthToken(crypto.randomUUID());
    mockAdapter.setCurrentUser({
      id: '674391a10000000000000003',
      name: 'System Administrator',
      email: 'admin.fixture@example.test',
      role: 'ADMIN',
      createdAt: '2026-08-01T08:00:00.000Z',
    });

    render(
      <MemoryRouter initialEntries={['/library']}>
        <App />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Advanced Data Structures Lecture Notes/i)).toBeInTheDocument();
    });

    // Select School of Mechanical Engineering (which has only a PENDING doc, 0 approved)
    const deptSelect = screen.getByLabelText(/^Department$/i);
    fireEvent.change(deptSelect, { target: { value: '674391b10000000000000002' } });

    await waitFor(() => {
      expect(screen.getByText(/Department: School of Mechanical Engineering/i)).toBeInTheDocument();
      expect(screen.getByText(/No Documents Found/i)).toBeInTheDocument();
      expect(screen.queryByText(/Advanced Data Structures Lecture Notes/i)).not.toBeInTheDocument();
    });

    // Switch to School of Computer Engineering (has 5 approved docs across 4 subjects)
    fireEvent.change(deptSelect, { target: { value: '674391b10000000000000001' } });
    await waitFor(() => {
      expect(screen.getByText(/Department: School of Computer Engineering/i)).toBeInTheDocument();
      expect(screen.getByText(/Advanced Data Structures Lecture Notes/i)).toBeInTheDocument();
    });
  });

  it('UC-02 & UC-07: redirects authenticated users away from /sign-in and shows submissionId + PENDING on upload', async () => {
    setAuthToken(crypto.randomUUID());
    mockAdapter.setCurrentUser({
      id: '674391a10000000000000002',
      name: 'Fixture Faculty',
      email: 'faculty.fixture@example.test',
      role: 'FACULTY',
      createdAt: '2026-09-01T10:30:00.000Z',
    });

    render(
      <MemoryRouter initialEntries={['/sign-in']}>
        <App />
      </MemoryRouter>,
    );

    // Authenticated Faculty visiting /sign-in is routed straight to Faculty Submissions dashboard
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /My Submissions/i })).toBeInTheDocument();
    });

    // Navigate to Upload PDF and submit a valid %PDF-1.4 file
    fireEvent.click(screen.getAllByRole('link', { name: /Upload/i })[0]!);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Upload Academic Resource/i })).toBeInTheDocument();
    });

    const validPdf = new File(['%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n'], 'architecture-notes.pdf', {
      type: 'application/pdf',
    });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [validPdf] } });

    await waitFor(() => {
      expect(screen.getByDisplayValue('architecture notes')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Submit for Review/i }));

    await waitFor(() => {
      expect(screen.getByText(/Submitted as PENDING \(ID:/i)).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /My Submissions/i })).toBeInTheDocument();
    });
  });
});
