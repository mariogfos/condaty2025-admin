import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: [
      'src/features/**/__tests__/**/*.{test,spec}.{ts,tsx}',
      'src/modulos/**/__tests__/**/*.{test,spec}.{ts,tsx}',
      'src/mk/**/__tests__/**/*.{test,spec}.{ts,tsx}',
    ],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
