import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useAssemblies } from '../useAssemblies';

// Mock useAxios
const mockExecute = vi.fn();
const mockReLoad = vi.fn();

vi.mock('@/mk/hooks/useAxios', () => ({
  default: vi.fn(() => ({
    execute: mockExecute,
    reLoad: mockReLoad,
    loaded: true,
  })),
}));

// Mock useAuth
vi.mock('@/mk/contexts/AuthProvider', () => ({
  useAuth: vi.fn(() => ({
    showToast: vi.fn(),
  })),
}));

describe('useAssemblies Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchAssemblies', () => {
    it('carga asambleas exitosamente', async () => {
      const mockAssemblies = [
        { id: 1, subject: 'Asamblea 1', status: 'S' },
        { id: 2, subject: 'Asamblea 2', status: 'P' },
      ];
      const mockResponse = {
        success: true,
        data: mockAssemblies,
        message: { total: 2, S: 1, P: 1 },
      };

      mockExecute.mockResolvedValueOnce({ data: mockResponse });

      const { result } = renderHook(() => useAssemblies());

      await act(async () => {
        await result.current.fetchAssemblies();
      });

      expect(result.current.assemblies).toEqual(mockAssemblies);
      expect(result.current.stats).toEqual({ total: 2, S: 1, P: 1 });
      expect(result.current.error).toBeNull();
    });

    it('maneja error al cargar asambleas', async () => {
      mockExecute.mockRejectedValueOnce(new Error('Error de red'));

      const { result } = renderHook(() => useAssemblies());

      await act(async () => {
        await result.current.fetchAssemblies();
      });

      expect(result.current.error).toBe('Error de red');
    });
  });

  describe('fetchAssemblyDetail', () => {
    it('obtiene detalle de asamblea correctamente', async () => {
      const mockAssembly = {
        id: 1,
        subject: 'Asamblea Anual',
        status: 'S',
        surveys: [],
      };
      mockExecute.mockResolvedValueOnce({
        data: { success: true, data: mockAssembly },
      });

      const { result } = renderHook(() => useAssemblies());

      let assembly;
      await act(async () => {
        assembly = await result.current.fetchAssemblyDetail('1');
      });
      
      expect(assembly).toEqual(mockAssembly);
    });

    it('retorna null cuando no hay éxito', async () => {
      mockExecute.mockResolvedValueOnce({ data: { success: false } });

      const { result } = renderHook(() => useAssemblies());

      let assembly;
      await act(async () => {
        assembly = await result.current.fetchAssemblyDetail('1');
      });
      
      expect(assembly).toBeNull();
    });
  });

  describe('updateAssembly', () => {
    it('actualiza asamblea exitosamente', async () => {
      mockExecute.mockResolvedValueOnce({
        data: { success: true },
      });

      const { result } = renderHook(() => useAssemblies());

      let success = false;
      await act(async () => {
        success = await result.current.updateAssembly(1, { subject: 'Nuevo' });
      });

      expect(success).toBe(true);
    });

    it('retorna false cuando falla', async () => {
      mockExecute.mockResolvedValueOnce({ data: { success: false } });

      const { result } = renderHook(() => useAssemblies());

      let success = true;
      await act(async () => {
        success = await result.current.updateAssembly(1, {});
      });

      expect(success).toBe(false);
    });
  });

  describe('state inicial', () => {
    it('inicializa con estados correctos', () => {
      const { result } = renderHook(() => useAssemblies());

      expect(result.current.assemblies).toEqual([]);
      expect(result.current.stats).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });
});