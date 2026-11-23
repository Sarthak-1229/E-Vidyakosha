import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';

describe('scaffold preview', () => {
  it('shows project name and marks features as preview, not completed', () => {
    render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'E-Vidyakosha home' })).toBeTruthy();
    expect(screen.getByText(/design preview/i)).toBeTruthy();
  });
});
