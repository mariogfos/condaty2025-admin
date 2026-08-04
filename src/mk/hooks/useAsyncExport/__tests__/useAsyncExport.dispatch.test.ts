/**
 * useAsyncExport — a dónde sale el request.
 *
 * Reemplaza dos pines source-parsing de S143e que miraban cómo estaba escrito
 * el archivo (`/endpoint\s*\?\s*await fetch/`). Se pusieron rojos cuando el
 * hook sumó `overrideType` para los customs —puro renombre de variables— sin
 * que el comportamiento cambiara. Acá se mide el request que sale, que es lo
 * único que puede romper a un usuario.
 *
 * Los tres caminos:
 *   1. `endpoint` pineado          → GET {endpoint}?_export={format}  (lista)
 *   2. sin `endpoint`              → POST /v3/reports/{type}/export   (BC)
 *   3. `overrideType` (custom)     → POST /v3/reports/{override}/export,
 *      IGNORANDO el endpoint de la lista: un custom no es la lista.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAsyncExport } from "../useAsyncExport";

vi.mock("@/mk/hooks/useToast", () => ({
  default: () => ({ showToast: vi.fn() }),
}));

/** Corta el flujo apenas se dispara: sólo interesa la PRIMERA llamada. */
const stubFetch = () => {
  const fetchMock = vi.fn(async () => ({
    ok: true,
    status: 202,
    json: async () => ({ job_id: null }),
  }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

const primeraLlamada = (mock: ReturnType<typeof stubFetch>) => ({
  url: String(mock.mock.calls[0]?.[0]),
  init: mock.mock.calls[0]?.[1] as RequestInit | undefined,
});

describe("useAsyncExport — dispatch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("con endpoint pineado exporta la LISTA por GET", async () => {
    const fetchMock = stubFetch();
    const { result } = renderHook(() =>
      useAsyncExport({ type: "payments", endpoint: "/v3/payments" }),
    );

    await act(async () => {
      await result.current.start({ format: "xlsx", filterBy: "paid_at:m" });
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const { url, init } = primeraLlamada(fetchMock);
    expect(url).toContain("/v3/payments?");
    expect(url).toContain("_export=xlsx");
    expect(url).toContain("filterBy=paid_at%3Am");
    expect(init?.method).toBe("GET");
  });

  it("sin endpoint cae al flujo por type (BC layer)", async () => {
    const fetchMock = stubFetch();
    const { result } = renderHook(() => useAsyncExport({ type: "accesses" }));

    await act(async () => {
      await result.current.start({ format: "pdf" });
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const { url, init } = primeraLlamada(fetchMock);
    expect(url).toContain("/v3/reports/accesses/export");
    expect(init?.method).toBe("POST");
  });

  /**
   * 🔴 Un custom NO puede salir por el endpoint de la lista aunque el módulo
   * lo tenga pineado: pediría la lista de pagos en vez del reporte custom, y
   * el usuario se bajaría el archivo equivocado sin ningún error.
   */
  it("un custom va por SU type, ignorando el endpoint de la lista", async () => {
    const fetchMock = stubFetch();
    const { result } = renderHook(() =>
      useAsyncExport({ type: "payments", endpoint: "/v3/payments" }),
    );

    await act(async () => {
      await result.current.start({ format: "xlsx" }, "payments-income");
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const { url, init } = primeraLlamada(fetchMock);
    expect(url).toContain("/v3/reports/payments-income/export");
    expect(url).not.toContain("/v3/payments?");
    expect(init?.method).toBe("POST");
  });
});
