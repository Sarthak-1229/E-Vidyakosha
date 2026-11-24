import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { loadEnv, normalizePath } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const require = createRequire(import.meta.url);
const pdfDist = normalizePath(dirname(require.resolve('pdfjs-dist/package.json')));

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    viteStaticCopy({
      targets: ['cmaps', 'standard_fonts', 'wasm'].map(directory => ({
        src: `${pdfDist}/${directory}/*`,
        dest: `pdfjs/${directory}`,
        rename: { stripBase: true },
      })),
    }),
  ],
  server: {
    port: 5173,
    strictPort: true,
    proxy: { '/api': loadEnv(mode, process.cwd(), '').API_PROXY_TARGET || 'http://127.0.0.1:4000' },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
  },
}));
