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
    include: ['src/modulos/**/__tests__/**/*.{test,spec}.{ts,tsx}', 'src/mk/**/__tests__/**/*.{test,spec}.{ts,tsx}', 'src/components/**/__tests__/**/*.{test,spec}.{ts,tsx}', 'src/types/__tests__/**/*.{test,spec}.{ts,tsx}', 'src/styles/__tests__/**/*.{test,spec}.{ts,tsx}', 'src/test/__tests__/**/*.{test,spec}.{ts,tsx}', 'src/app/**/__tests__/**/*.{test,spec}.{ts,tsx}'],
    // ⚠️ `include` es una LISTA BLANCA: un test fuera de estos árboles no se
    // corre y no avisa — vitest sale con «No test files found» sólo si lo
    // pedís por nombre. Al agregar un test en una carpeta nueva, agregarla acá
    // también (CDT-84).
    //
    // 🔴 `src/app/**` faltaba, así que NINGUNA página de Next podía tener test
    // — y ahí vivía `/unittypes`, que renderizaba un objeto como componente.
    // Se agregó el 2026-09-02, con el test que lo mide.
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
