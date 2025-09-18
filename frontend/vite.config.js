import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, 'src'),
  base: './', // Use relative paths for assets
  build: {
    outDir: path.resolve(__dirname, '../static/spa'),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  }
});
