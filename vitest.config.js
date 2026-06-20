import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    css: true,
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,jsx}', 'scripts/**/*.{test,spec}.mjs'],
    exclude: ['assets/**', 'archive/**', 'deliverables/**', 'workbench/**'],
    setupFiles: './src/test/setup.js'
  }
});
