/**
 * Reemplaza a `S113AsyncExportBaseUrlPin.test.ts` (CDT-46, corte 4).
 *
 * Aquel pin leía `useAsyncExport.ts` como TEXTO y afirmaba que adentro
 * estaban escritos `API_BASE_URL`, `Bearer`, `credentials: 'include'` y
 * `const buildBackendUrl =`. Medido el 2026-08-15: rompiendo el helper
 * a mano —`${API_BASE_URL}${path}` en vez del strip de `/api`, que es
 * EXACTAMENTE el bug S117 que decía cuidar— la suite entera quedó en
 * 804 verdes. El pin miraba que el nombre del helper estuviera escrito,
 * nunca lo que el helper hace.
 *
 * Acá se corre el hook y se mira la URL que realmente sale por `fetch`.
 *
 * Lo que se mide, uno a uno:
 *   - el POST del encolado sale ABSOLUTO contra NEXT_PUBLIC_API_URL,
 *     no relativo contra el front (bug original S113: 404 en todos los
 *     exports);
 *   - el path canónico es `/v3/reports/...`, no el alias legacy;
 *   - el `download_url` que manda el back ya trae `/api/`, y el baseURL
 *     también termina en `/api`: la URL de descarga NO puede tener
 *     `/api/api/` (bug S115/S117 → 404 → el front bajaba HTML de Next
 *     como si fuera un PDF);
 *   - va el `Authorization: Bearer` (sin él Sanctum devuelve 401) y el
 *     `credentials: "include"` (el back tiene supports_credentials).
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

vi.mock("../../useToast", () => ({
  default: () => ({ showToast: vi.fn() }),
}));

const API_URL = "http://back.test/api";

// `API_BASE_URL` es una const de módulo: se evalúa al importar. Por eso el
// env se pinea ANTES del import dinámico, y no con un import estático que
// vitest hoistea por arriba de esta línea.
let useAsyncExport: typeof import("../useAsyncExport").useAsyncExport;

beforeAll(async () => {
  process.env.NEXT_PUBLIC_API_URL = API_URL;
  vi.resetModules();
  ({ useAsyncExport } = await import("../useAsyncExport"));
});

/** Encola → poll → completed, con el `download_url` que manda el back. */
const mockExportFlow = (downloadUrl = "/api/v3/reports/job-1/download") => {
  const responses = [
    { status: 202, body: { job_id: "job-1", status: "pending" } },
    { status: 200, body: { status: "completed", download_url: downloadUrl } },
    { status: 200, body: {} },
  ];
  let i = 0;
  return vi.fn(async () => {
    const r = responses[i] ?? responses[responses.length - 1];
    i++;
    return {
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      headers: new Headers({
        "Content-Disposition": 'attachment; filename="Reporte.pdf"',
      }),
      json: async () => r.body,
      blob: async () => new Blob(["PDF"], { type: "application/pdf" }),
    } as any;
  });
};

const urlDeLaLlamada = (fetchMock: any, n: number): string =>
  String(fetchMock.mock.calls[n][0]);

const opcionesDeLaLlamada = (fetchMock: any, n: number): any =>
  fetchMock.mock.calls[n][1];

describe("useAsyncExport — la URL que sale al backend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem(
      (process.env.NEXT_PUBLIC_AUTH_IAM as string) + "token",
      JSON.stringify({ token: "tok-123" }),
    );
  });

  it("el encolado sale absoluto contra el back, al path canónico /v3/reports", async () => {
    const fetchMock = mockExportFlow();
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() =>
      useAsyncExport({ type: "payments", pollIntervalMs: 20 }),
    );
    await act(async () => {
      await result.current.start({ format: "pdf" });
    });

    // Exacta a propósito: cubre de una las tres cosas que el pin de texto
    // miraba por separado — que sea ABSOLUTA (el bug S113 la dejaba
    // relativa y la resolvía el front en :3000 → 404), que use el path
    // canónico `/v3/...` y no el alias legacy `/reports/...`.
    expect(urlDeLaLlamada(fetchMock, 0)).toBe(
      `${API_URL}/v3/reports/payments/export`,
    );
  });

  it("la descarga NO duplica el /api que ya trae el baseURL", async () => {
    const fetchMock = mockExportFlow("/api/v3/reports/job-1/download");
    global.fetch = fetchMock as unknown as typeof fetch;
    vi.spyOn(window.URL, "createObjectURL").mockReturnValue("blob:x");
    vi.spyOn(window.URL, "revokeObjectURL").mockImplementation(() => {});

    const { result } = renderHook(() =>
      useAsyncExport({ type: "payments", pollIntervalMs: 20 }),
    );
    await act(async () => {
      await result.current.start({ format: "pdf" });
    });
    await waitFor(() => {
      expect(result.current.state.status).toBe("completed");
    });
    await act(async () => {
      await result.current.download();
    });

    const url = urlDeLaLlamada(fetchMock, fetchMock.mock.calls.length - 1);
    expect(url).not.toContain("/api/api/");
    expect(url).toBe(`${API_URL}/v3/reports/job-1/download`);
  });

  it("un download_url que YA es absoluto se respeta tal cual", async () => {
    const absoluto = "https://cdn.test/reportes/job-1.pdf";
    const fetchMock = mockExportFlow(absoluto);
    global.fetch = fetchMock as unknown as typeof fetch;
    vi.spyOn(window.URL, "createObjectURL").mockReturnValue("blob:x");
    vi.spyOn(window.URL, "revokeObjectURL").mockImplementation(() => {});

    const { result } = renderHook(() =>
      useAsyncExport({ type: "payments", pollIntervalMs: 20 }),
    );
    await act(async () => {
      await result.current.start({ format: "pdf" });
    });
    await waitFor(() => {
      expect(result.current.state.status).toBe("completed");
    });
    await act(async () => {
      await result.current.download();
    });

    expect(urlDeLaLlamada(fetchMock, fetchMock.mock.calls.length - 1)).toBe(
      absoluto,
    );
  });

  it("cada llamada lleva el Bearer del localStorage y credentials: include", async () => {
    const fetchMock = mockExportFlow();
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() =>
      useAsyncExport({ type: "payments", pollIntervalMs: 20 }),
    );
    await act(async () => {
      await result.current.start({ format: "pdf" });
    });
    await waitFor(() => {
      expect(result.current.state.status).toBe("completed");
    });

    for (let i = 0; i < fetchMock.mock.calls.length; i++) {
      const opts = opcionesDeLaLlamada(fetchMock, i);
      expect(opts.headers.Authorization).toBe("Bearer tok-123");
      expect(opts.credentials).toBe("include");
    }
  });
});
