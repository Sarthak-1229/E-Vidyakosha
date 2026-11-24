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
});
