import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // ⚠️ `src/components/**` faltaba: los componentes compartidos NO podían
    // tener tests — se escribían y vitest ni los veía. Agregado el 2026-08-13
    // al escribir el aviso de configuración del dashboard.
    include: ['src/modulos/**/__tests__/**/*.{test,spec}.{ts,tsx}', 'src/mk/**/__tests__/**/*.{test,spec}.{ts,tsx}', 'src/components/**/__tests__/**/*.{test,spec}.{ts,tsx}', 'src/types/__tests__/**/*.{test,spec}.{ts,tsx}'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
