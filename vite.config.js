import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      ignored: [
        '**/archive/**',
        '**/assets/references/APP/**',
        '**/backend/**',
        '**/deliverables/**',
        '**/dist/**',
        '**/node_modules/**',
        '**/workbench/**'
      ]
    }
  }
});
