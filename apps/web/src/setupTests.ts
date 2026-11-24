import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

vi.stubEnv('VITE_USE_MOCKS', 'true');

// Stub URL object URLs for jsdom environment (used by PdfViewer)
if (typeof window !== 'undefined') {
  if (!window.URL.createObjectURL) {
    window.URL.createObjectURL = () => 'blob:mock-pdf-stream-url';
  }
  if (!window.URL.revokeObjectURL) {
    window.URL.revokeObjectURL = () => {};
  }

  // Stub matchMedia for responsive queries
  window.matchMedia =
    window.matchMedia ||
    function () {
      return {
        matches: false,
        media: '',
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      };
    };
}
