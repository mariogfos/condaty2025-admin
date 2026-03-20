import { renderHook, waitFor, act } from '@testing-library/react';
import { useMySurveys } from '../hooks/useMySurveys';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock useAxios
const mockExecute = vi.fn();
const mockReLoad = vi.fn();

vi.mock('@/mk/hooks/useAxios', () => ({
  default: () => ({
    execute: mockExecute,
    reLoad: mockReLoad,
  }),
}));

describe('useMySurveys Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inicializa con valores por defecto', () => {
    const { result } = renderHook(() => useMySurveys());
    expect(result.current.surveys).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.counts).toBeNull();
  });

  it('fetchCounts actualiza el estado de los contadores', async () => {
    const mockCounts = { P: 5, R: 2, E: 10 };
    mockExecute.mockResolvedValueOnce({ 
      data: { success: true, data: mockCounts },
      error: null,
      loaded: true 
    });

    const { result } = renderHook(() => useMySurveys());
    
    await result.current.fetchCounts();

    await waitFor(() => {
        expect(result.current.counts).toEqual(mockCounts);
    });
    expect(mockExecute).toHaveBeenCalledWith("/surveys/my-counts", "GET", {}, false, true);
  });

  it('fetchSurveys carga las encuestas correctamente', async () => {
    const mockSurveys = [{ id: 1, title: 'Encuesta Test' }];
    mockExecute.mockResolvedValueOnce({ 
      data: { success: true, data: mockSurveys },
      error: null,
      loaded: true 
    });

    const { result } = renderHook(() => useMySurveys());
    
    await result.current.fetchSurveys('P');

    await waitFor(() => {
      expect(result.current.surveys).toEqual(mockSurveys);
      expect(result.current.loading).toBe(false);
    });
  });

  it('fetchSurveyDetail utiliza el caché para evitar llamadas repetidas', async () => {
    const mockDetail = { id: '123', questions: [] };
    mockExecute.mockResolvedValue({ 
      data: { success: true, data: { survey: mockDetail } },
      error: null,
      loaded: true 
    });

    const { result } = renderHook(() => useMySurveys());
    
    // Primera llamada
    let res1;
    await act(async () => {
      res1 = await result.current.fetchSurveyDetail('123');
    });
    
    expect(res1).toEqual(mockDetail);
    expect(mockExecute).toHaveBeenCalledTimes(1);

    // Segunda llamada (debería venir del caché interno del hook: detailsCache)
    let res2;
    await act(async () => {
      res2 = await result.current.fetchSurveyDetail('123');
    });

    expect(res2).toEqual(mockDetail);
    expect(mockExecute).toHaveBeenCalledTimes(1); // Todavía 1, no llamó por segunda vez
  });
});
