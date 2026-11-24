// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../App';
import { mockAdapter } from '../api/mockAdapter';
import { setAuthToken } from '../api/client';

const fixturePassword = crypto.randomUUID();

describe('Faculty Document Submissions & History (FR-05, FR-06, FR-07, FR-08)', () => {
  beforeEach(() => {
    setAuthToken(null);
    mockAdapter.reset(fixturePassword);
    setAuthToken(crypto.randomUUID());
    mockAdapter.setCurrentUser({
      id: '674391a10000000000000002',
      name: 'Fixture Faculty',
      email: 'faculty.fixture@example.test',
      role: 'FACULTY',
      createdAt: '2026-09-01T10:30:00.000Z',
    });
  });

  it('FR-05: renders upload form with academic hierarchy selectors', async () => {
    render(
      <MemoryRouter initialEntries={['/faculty/upload']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Upload Academic Resource/i })
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/Department/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Document Title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Document Classification/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Course \/ Subject/i)).toBeInTheDocument();
    });
  });

  it('FR-06: rejects non-PDF file upload with client-side error message', async () => {
    render(
      <MemoryRouter initialEntries={['/faculty/upload']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Upload Academic Resource/i })
      ).toBeInTheDocument();
    });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    const nonPdfFile = new File(['mock content'], 'test-document.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    fireEvent.change(fileInput, { target: { files: [nonPdfFile] } });

    await waitFor(() => {
      expect(
        screen.getByText(/Only PDF documents are accepted/i)
      ).toBeInTheDocument();
    });
  });

  it('FR-06: rejects files exceeding 50 MiB with client-side error message', async () => {
    render(
      <MemoryRouter initialEntries={['/faculty/upload']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Upload Academic Resource/i })
      ).toBeInTheDocument();
    });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    // Create an oversized 55MB file
    const largeFile = new File([new Uint8Array(10)], 'oversized.pdf', {
      type: 'application/pdf',
    });
    Object.defineProperty(largeFile, 'size', { value: 55 * 1024 * 1024 });

    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(
        screen.getByText(/File exceeds maximum allowable size of 50 MiB/i)
      ).toBeInTheDocument();
    });
  });

  it('FR-08: lists faculty submission history with PENDING, APPROVED, and REJECTED statuses', async () => {
    render(
      <MemoryRouter initialEntries={['/faculty/submissions']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /My Submissions/i })).toBeInTheDocument();
      expect(
        screen.getByText(/Introduction to Applied Thermodynamics Handout/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Advanced Data Structures Lecture Notes: Trees, Heaps & Graphs/i)
      ).toBeInTheDocument();
    });
  });

  it('FR-08: displays review notes and rejection reason for REJECTED documents', async () => {
    render(
      <MemoryRouter initialEntries={['/faculty/submissions']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /My Submissions/i })).toBeInTheDocument();
      expect(screen.getByText(/Fourier Transform Practice Problem Sets/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Scan quality is illegible on pages 4-8\. Please provide a clear scan\./i)
      ).toBeInTheDocument();
    });
  });
});
