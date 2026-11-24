// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../App';
import { mockAdapter } from '../api/mockAdapter';
import { setAuthToken } from '../api/client';

const fixturePassword = crypto.randomUUID();

describe('Approved Document Discovery & Search (FR-09, FR-10, FR-11, FR-12)', () => {
  beforeEach(() => {
    setAuthToken(null);
    mockAdapter.reset(fixturePassword);
    setAuthToken(crypto.randomUUID());
    mockAdapter.setCurrentUser({
      id: '674391a10000000000000001',
      name: 'Fixture Student',
      email: 'student.fixture@mitaoe.ac.in',
      role: 'STUDENT',
      createdAt: '2026-10-15T09:00:00.000Z',
    });
  });

  it('FR-09: displays only approved documents in the library catalog', async () => {
    render(
      <MemoryRouter initialEntries={['/library']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Advanced Data Structures Lecture Notes/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Relational Database Design and Normalization Lab Manual/i)
      ).toBeInTheDocument();
    });

    // Pending and rejected documents MUST NOT appear in the general catalog
    expect(
      screen.queryByText(/Introduction to Applied Thermodynamics Handout/i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Fourier Transform Practice Problem Sets/i)
    ).not.toBeInTheDocument();
  });

  it('FR-10: searches approved documents by title query', async () => {
    render(
      <MemoryRouter initialEntries={['/library']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Advanced Data Structures Lecture Notes/i)
      ).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search by document title/i);
    fireEvent.change(searchInput, { target: { value: 'Classification' } });

    await waitFor(() => {
      expect(
        screen.getByText(/Deep Learning Architectures for Academic Document Classification/i)
      ).toBeInTheDocument();
      expect(
        screen.queryByText(/Relational Database Design and Normalization Lab Manual/i)
      ).not.toBeInTheDocument();
    });
  });

  it('FR-10: displays explicit empty state when no documents match', async () => {
    render(
      <MemoryRouter initialEntries={['/library']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Advanced Data Structures Lecture Notes/i)
      ).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search by document title/i);
    fireEvent.change(searchInput, { target: { value: 'Nonexistent Zzqkpl 765432' } });

    await waitFor(() => {
      expect(screen.getByText(/No Documents Found/i)).toBeInTheDocument();
      expect(
        screen.getByText(/No approved academic resources match your current search query/i)
      ).toBeInTheDocument();
    });
  });

  it('FR-11: renders document detail page with responsive PDF viewer', async () => {
    render(
      <MemoryRouter initialEntries={['/library/674391d10000000000000001']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', {
          name: /Advanced Data Structures Lecture Notes: Trees, Heaps & Graphs/i,
        })
      ).toBeInTheDocument();
      expect(screen.getByTestId('pdf-viewer-container')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Zoom in/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Download PDF/i })).toBeInTheDocument();
    });
  });
});
