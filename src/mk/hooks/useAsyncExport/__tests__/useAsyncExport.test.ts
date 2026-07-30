/**
 * useAsyncExport tests (S33 — NEW-NEW-43 PDF Reports Async + Chunking)
 *
 * Pinea el flow end-to-end del hook:
 * - start() → POST → 202 → polling → completed → download URL
 * - start() → POST → 202 → polling → failed → error callback
 * - start() → POST → 400 → fail sin polling
 * - reset() → cancela polling
 * - download() → fetch blob → <a> click
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAsyncExport } from "../useAsyncExport";

// Mock useToast to avoid pulling in ToastProvider.
// S143e-bk-16 (HALLAZGO-NEW-71, binding, cross-project): el mock viejo
// pineaba `useToast: () => ({...})` (named export) pero el import en
// `useAsyncExport.ts:4` es DEFAULT (`import useToast from "../useToast"`).
// Vitest tira "No default export is defined on the mock". Fix: pinear el
// `default` export. Esto desbloquea 7 tests pre-existentes que fallaban
// desde antes de este sprint.
vi.mock("../../useToast", () => ({
  default: () => ({
    showToast: vi.fn(),
  }),
}));

// Helper: create a delayed resolved promise
const delayed = <T>(value: T, ms = 0): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

// Helper: mock fetch with a sequence of responses (for polling)
const mockFetchSequence = (responses: Array<{ status: number; body: any }>) => {
  let callIndex = 0;
  return vi.fn(async () => {
    const r = responses[callIndex] ?? responses[responses.length - 1];
    callIndex++;
    return {
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      json: async () => r.body,
      blob: async () => new Blob(["PDF_CONTENT"], { type: "application/pdf" }),
    } as any;
  });
};

describe("useAsyncExport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-expect-error — global fetch mock
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts in idle state", () => {
    const { result } = renderHook(() =>
      useAsyncExport({ type: "payments" }),
    );
    expect(result.current.state.isExporting).toBe(false);
    expect(result.current.state.status).toBe("idle");
    expect(result.current.state.progress).toBe(0);
  });

  it("start() → POST → 202 + pending → polling → completed", async () => {
    const fetchMock = mockFetchSequence([
      // POST /api/v3/reports/payments/export
      {
        status: 202,
        body: {
          success: true,
          job_id: "test-job-123",
          status: "pending",
          progress: 0,
          status_url: "/api/v3/reports/test-job-123/status",
          download_url: null,
          created_at: new Date().toISOString(),
        },
      },
      // GET /api/v3/reports/test-job-123/status (primer poll inmediato)
      {
        status: 200,
        body: {
          success: true,
          job_id: "test-job-123",
          status: "processing",
          progress: 30,
          current_chunk: 2,
          total_chunks: 5,
        },
      },
      // GET /status (segundo poll)
      {
        status: 200,
        body: {
          success: true,
          job_id: "test-job-123",
          status: "completed",
          progress: 100,
          current_chunk: 5,
          total_chunks: 5,
          download_url: "/api/v3/reports/test-job-123/download",
        },
      },
    ]);
    // @ts-expect-error
    global.fetch = fetchMock;

    const onCompleted = vi.fn();
    const { result } = renderHook(() =>
      useAsyncExport({ type: "payments", pollIntervalMs: 50, onCompleted }),
    );

    await act(async () => {
      await result.current.start({ filterBy: "in_at:m" });
    });

    await waitFor(() => {
      expect(result.current.state.status).toBe("completed");
    });

    expect(result.current.state.isExporting).toBe(false);
    expect(result.current.state.progress).toBe(100);
    expect(result.current.state.downloadUrl).toBe(
      "/api/v3/reports/test-job-123/download",
    );
    expect(onCompleted).toHaveBeenCalledTimes(1);
  });

  it("start() → POST → 202 → polling → failed → error callback", async () => {
    const fetchMock = mockFetchSequence([
      // POST
      {
        status: 202,
        body: { job_id: "fail-job", status: "pending" },
      },
      // GET /status → failed
      {
        status: 200,
        body: {
          status: "failed",
          error_message: "Data provider exploded",
        },
      },
    ]);
    // @ts-expect-error
    global.fetch = fetchMock;

    const onError = vi.fn();
    const { result } = renderHook(() =>
      useAsyncExport({ type: "payments", pollIntervalMs: 50, onError }),
    );

    await act(async () => {
      await result.current.start({});
    });

    await waitFor(() => {
      expect(result.current.state.status).toBe("failed");
    });

    expect(result.current.state.errorMessage).toBe("Data provider exploded");
    expect(result.current.state.isExporting).toBe(false);
    expect(onError).toHaveBeenCalledWith("Data provider exploded");
  });

  it("start() → POST → 400 (unregistered type) → fail sin polling", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
        message: "ReportType 'foo' no registrado.",
        available_types: ["array_chunked"],
      }),
    }));
    // @ts-expect-error
    global.fetch = fetchMock;

    const onError = vi.fn();
    const { result } = renderHook(() =>
      useAsyncExport({ type: "foo", onError }),
    );

    await act(async () => {
      await result.current.start({});
    });

    expect(result.current.state.status).toBe("failed");
    expect(result.current.state.errorMessage).toContain("foo");
    expect(result.current.state.isExporting).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1); // Solo el POST, no polling
    expect(onError).toHaveBeenCalledWith(
      expect.stringContaining("foo"),
    );
  });

  it("start() → POST → 401 (unauthenticated) → fail", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 401,
      json: async () => ({}),
    }));
    // @ts-expect-error
    global.fetch = fetchMock;

    const onError = vi.fn();
    const { result } = renderHook(() =>
      useAsyncExport({ type: "payments", onError }),
    );

    await act(async () => {
      await result.current.start({});
    });

    expect(result.current.state.status).toBe("failed");
    expect(result.current.state.errorMessage).toBe("No autenticado");
    expect(onError).toHaveBeenCalledWith("No autenticado");
  });

  it("start() while already exporting → ignored", async () => {
    // El primer POST retorna 202 (success) pero el primer poll devuelve
    // 'processing' (no terminal) → el ref sigue true y el setInterval
    // queda pineado. El segundo start() debe ser ignorado.
    const fetchMock = mockFetchSequence([
      // POST /export
      { status: 202, body: { job_id: "job-1", status: "pending" } },
      // GET /status (primer poll) — processing, no terminal
      { status: 200, body: { status: "processing", progress: 50 } },
      // GET /status (segundo poll) — processing, no terminal
      { status: 200, body: { status: "processing", progress: 60 } },
    ]);
    // @ts-expect-error
    global.fetch = fetchMock;

    const { result } = renderHook(() =>
      useAsyncExport({ type: "payments", pollIntervalMs: 50 }),
    );

    // Primer start — completa el POST, primer poll retorna 'processing'
    await act(async () => {
      await result.current.start({});
    });

    // En este punto: state.isExporting=true, ref=true, setInterval pineado
    // El primer start pineó 1 POST + 1 poll = 2 calls totales.
    const callsAfterFirstStart = fetchMock.mock.calls.length;
    expect(callsAfterFirstStart).toBe(2); // 1 POST + 1 poll
    expect(result.current.state.isExporting).toBe(true);
    expect(result.current.state.status).toBe("processing");

    // Segundo start — debe ser ignorado porque el ref sigue true
    await act(async () => {
      await result.current.start({});
    });

    // El segundo start NO pineá un nuevo POST (sigue en 2 calls totales)
    expect(fetchMock).toHaveBeenCalledTimes(callsAfterFirstStart);
  });

  it("reset() clears polling and resets state", async () => {
    const fetchMock = mockFetchSequence([
      // POST
      { status: 202, body: { job_id: "job-reset", status: "pending" } },
      // Polls que se demoran (van a ser cancelados por reset)
      delayed({ status: 200, body: { status: "processing" } }, 1000) as any,
    ]);
    // @ts-expect-error
    global.fetch = fetchMock;

    const { result } = renderHook(() =>
      useAsyncExport({ type: "payments", pollIntervalMs: 50 }),
    );

    await act(async () => {
      await result.current.start({});
    });

    // Reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.state.status).toBe("idle");
    expect(result.current.state.isExporting).toBe(false);
    expect(result.current.state.jobId).toBe(null);
  });

  /**
   * S143e-bk-16 (HALLAZGO-NEW-70, binding, cross-project): en el path
   * `endpoint` (S143e), los params DEBEN serializarse al query string
   * del GET. Antes se IGNORABAN → el export salía con TODA la data sin
   * filtros aplicados. Pineamos que filterBy + searchBy + fechas +
   * format llegan como query params.
   */
  it("start() con endpoint → serializa params al query string (HALLAZGO-NEW-70)", async () => {
    const fetchMock = mockFetchSequence([
      // GET /v3/payments?_export=pdf&... → 202 con job_id
      { status: 202, body: { job_id: "job-filter", status: "pending" } },
      // poll → completed
      {
        status: 200,
        body: {
          status: "completed",
          download_url: "/api/v3/reports/job-filter/download",
        },
      },
    ]);
    // @ts-expect-error
    global.fetch = fetchMock;

    const { result } = renderHook(() =>
      useAsyncExport({
        type: "payments",
        endpoint: "/v3/payments",
        pollIntervalMs: 50,
      }),
    );

    await act(async () => {
      await result.current.start({
        filterBy: ["paid_at:m", "status:1"],
        searchBy: { searchBy: "foo" },
        startDate: "2026-01-01",
        endDate: "2026-07-29",
        format: "pdf",
      });
    });

    await waitFor(() => {
      expect(result.current.state.status).toBe("completed");
    });

    // El primer fetch debe ser GET con query string conteniendo los filtros.
    const firstCall = fetchMock.mock.calls[0];
    const url: string = firstCall[0];
    const options = firstCall[1];
    expect(options.method).toBe("GET");
    expect(url).toContain("/v3/payments");
    expect(url).toContain("_export=pdf");
    // S143e-bk-18 (HALLAZGO-NEW-76): el flow S143e pinea `fullType=L`
    // EXPLÍCITAMENTE para unificar el path de lista y export (el listado
    // normal ya pineá fullType=L vía useCrud.tsx:1022).
    expect(url).toContain("fullType=L");
    // filterBy array → filterBy[]=paid_at:m&filterBy[]=status:1
    expect(url).toContain("filterBy%5B%5D=paid_at%3Am");
    expect(url).toContain("filterBy%5B%5D=status%3A1");
    // searchBy object → searchBy[searchBy]=foo
    expect(url).toContain("searchBy%5BsearchBy%5D=foo");
    // primitivos
    expect(url).toContain("startDate=2026-01-01");
    expect(url).toContain("endDate=2026-07-29");
    // format NO se pinea como key (va como _export)
    expect(url).not.toContain("format=pdf");
  });

  /**
   * S143e-bk-16: el path legacy POST sigue pineando `body: JSON.stringify(params)`
   * intacto. BC layer pineado.
   */
  it("start() SIN endpoint → POST con body JSON (BC layer legacy intacto)", async () => {
    const fetchMock = mockFetchSequence([
      { status: 202, body: { job_id: "job-legacy", status: "pending" } },
      {
        status: 200,
        body: {
          status: "completed",
          download_url: "/api/v3/reports/job-legacy/download",
        },
      },
    ]);
    // @ts-expect-error
    global.fetch = fetchMock;

    const { result } = renderHook(() =>
      useAsyncExport({ type: "payments", pollIntervalMs: 50 }),
    );

    await act(async () => {
      await result.current.start({
        filterBy: ["paid_at:m"],
        searchBy: { searchBy: "foo" },
        format: "xlsx",
      });
    });

    await waitFor(() => {
      expect(result.current.state.status).toBe("completed");
    });

    // El primer fetch debe ser POST con body JSON conteniendo los params.
    const firstCall = fetchMock.mock.calls[0];
    const url: string = firstCall[0];
    const options = firstCall[1];
    expect(options.method).toBe("POST");
    expect(url).toContain("/v3/reports/payments/export");
    expect(options.body).toBe(
      JSON.stringify({
        filterBy: ["paid_at:m"],
        searchBy: { searchBy: "foo" },
        format: "xlsx",
      }),
    );
  });
});
