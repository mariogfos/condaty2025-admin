/**
 * Reemplaza a `S116bDownloadHistoryBaseUrlPin.test.ts` y a
 * `S116bDownloadHistoryEndpointAndStatusPin.test.ts` (CDT-46, corte 4).
 *
 * 🔴 Medido el 2026-08-15: se repuso el bug ORIGINAL de S116b —el GET del
 * historial saliendo con ruta RELATIVA, que el navegador resuelve contra
 * el front en :3000 y termina en 404 silencioso con el panel diciendo
 * "Aún no generaste ningún reporte" para siempre— y la suite entera quedó
 * en 808 verdes, los dos pines incluidos.
 *
 * Por qué no lo veían: el pin buscaba `fetch("/api/v3/reports"...)` con la
 * llamada y el string en la MISMA expresión. El componente de hoy arma
 * `const url = ...` dos líneas antes y hace `fetch(url, ...)`. El pin medía
 * con la lente de cómo se veía el bug la primera vez, no de cómo está
 * escrito el código.
 *
 * Acá se renderiza el componente y se miran las requests que salen.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

const API_URL = "http://back.test/api";

// `API_BASE_URL` es const de módulo: se evalúa al importar, así que el env
// va antes del import dinámico. Con `NEXT_PUBLIC_API_URL` vacío (lo que
// pasaba en los tests de antes) una URL relativa y una absoluta se ven
// IGUAL, y el bug no se puede medir.
let DownloadHistory: typeof import("../DownloadHistory").default;

beforeAll(async () => {
  process.env.NEXT_PUBLIC_API_URL = API_URL;
  vi.resetModules();
  DownloadHistory = (await import("../DownloadHistory")).default;
});

const TYPES = {
  success: true,
  data: ["payments"],
  options: [{ type: "payments", label: "Ingresos" }],
};

const item = (over: Record<string, unknown> = {}) => ({
  uuid: "u-1",
  type: "payments",
  name: "Ingresos",
  format: "pdf",
  status: "completed",
  progress: 100,
  download_url: "/api/v3/reports/u-1/download",
  created_at: "2026-08-04T20:00:00-04:00",
  ...over,
});

type Llamada = { url: string; init: any };

function mockFetch(llamadas: Llamada[], data: any[] = [item()]) {
  return vi.fn(async (url: unknown, init?: any) => {
    const href = String(url);
    llamadas.push({ url: href, init });
    if (href.includes("/reports/types")) {
      return { ok: true, status: 200, json: async () => TYPES } as Response;
    }
    if (href.includes("/download")) {
      return {
        ok: true,
        status: 200,
        headers: new Headers({
          "Content-Disposition": 'attachment; filename="Reporte.pdf"',
        }),
        blob: async () => new Blob(["PDF"], { type: "application/pdf" }),
      } as unknown as Response;
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({ success: true, data, total: data.length, page: 1, perPage: 20 }),
    } as Response;
  });
}

/** La request del listado, que es la que el pin decía cuidar. */
const elListado = (llamadas: Llamada[]) =>
  llamadas.find((l) => !l.url.includes("/types") && !l.url.includes("/download"));

describe("DownloadHistory — las requests que salen", () => {
  let llamadas: Llamada[];

  beforeEach(() => {
    llamadas = [];
    localStorage.setItem(
      (process.env.NEXT_PUBLIC_AUTH_IAM as string) + "token",
      JSON.stringify({ token: "tok-123" }),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("el listado sale ABSOLUTO contra el back, no relativo contra el front", async () => {
    vi.stubGlobal("fetch", mockFetch(llamadas));
    render(<DownloadHistory />);

    await waitFor(() => expect(elListado(llamadas)).toBeTruthy());
    // Sobre el string crudo a propósito: con `new URL()` una ruta relativa
    // tira "Invalid URL" y el mensaje de falla no dice qué salió.
    expect(elListado(llamadas)!.url.split("?")[0]).toBe(`${API_URL}/v3/reports`);
  });

  it("el listado lleva status, page y perPage, y NO lleva user_id", async () => {
    vi.stubGlobal("fetch", mockFetch(llamadas));
    render(<DownloadHistory />);

    await waitFor(() => expect(elListado(llamadas)).toBeTruthy());
    const q = new URL(elListado(llamadas)!.url, "http://front.test")
      .searchParams;
    expect(q.get("status")).toBe("completed");
    expect(q.get("page")).toBe("1");
    expect(q.get("perPage")).toBe("20");
    // Anti-IDOR: el back filtra por el user del token. Si el front manda
    // user_id, el multi-tenant pasa a depender de un query param.
    expect(q.get("user_id")).toBeNull();
  });

  it("el listado lleva el Bearer del localStorage y credentials: include", async () => {
    vi.stubGlobal("fetch", mockFetch(llamadas));
    render(<DownloadHistory />);

    await waitFor(() => expect(elListado(llamadas)).toBeTruthy());
    const { init } = elListado(llamadas)!;
    expect(init.headers.Authorization).toBe("Bearer tok-123");
    expect(init.credentials).toBe("include");
  });

  it("la descarga NO duplica el /api que ya trae el baseURL", async () => {
    vi.stubGlobal("fetch", mockFetch(llamadas));
    vi.spyOn(window.URL, "createObjectURL").mockReturnValue("blob:x");
    vi.spyOn(window.URL, "revokeObjectURL").mockImplementation(() => {});
    render(<DownloadHistory />);

    fireEvent.click(await screen.findByTestId("download-history-download-btn"));

    await waitFor(() =>
      expect(llamadas.some((l) => l.url.includes("/download"))).toBe(true),
    );
    const descarga = llamadas.find((l) => l.url.includes("/download"))!;
    // El back manda `download_url` con `/api/...` y el baseURL ya termina
    // en `/api`: concatenar derecho da `/api/api/` → 404 → el front baja
    // el HTML de Next como si fuera el PDF.
    expect(descarga.url).toBe(`${API_URL}/v3/reports/u-1/download`);
  });

  it("elegir un módulo lo manda en el query y vuelve a la página 1", async () => {
    // El back pagina de a 20; con 25 en total hay una página 2 a la que ir.
    const muchos = Array.from({ length: 20 }, (_, i) =>
      item({ uuid: `u-${i}` }),
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: unknown, init?: any) => {
        const href = String(url);
        llamadas.push({ url: href, init });
        if (href.includes("/reports/types")) {
          return { ok: true, status: 200, json: async () => TYPES } as Response;
        }
        return {
          ok: true,
          status: 200,
          // El total vive en `meta`, que es de donde el componente lo lee.
          json: async () => ({ success: true, data: muchos, meta: { total: 25 } }),
        } as Response;
      }),
    );
    render(<DownloadHistory />);

    await waitFor(() => expect(elListado(llamadas)).toBeTruthy());
    fireEvent.click(await screen.findByText(/Siguiente/));
    await waitFor(() =>
      expect(
        llamadas.some((l) => l.url.includes("page=2")),
      ).toBe(true),
    );

    fireEvent.change(await screen.findByTestId("download-history-type-filter"), {
      target: { value: "payments" },
    });

    // Quedarse en la página 5 de un filtro que ya no existe deja al usuario
    // mirando una lista vacía sin entender por qué.
    await waitFor(() => {
      const ultima = [...llamadas]
        .reverse()
        .find((l) => l.url.includes("status="))!;
      const q = new URL(ultima.url, "http://front.test").searchParams;
      expect(q.get("type")).toBe("payments");
      expect(q.get("page")).toBe("1");
    });
  });

  it("si el parent manda onDownload, la descarga la hace él y no sale request", async () => {
    vi.stubGlobal("fetch", mockFetch(llamadas));
    const onDownload = vi.fn();
    render(<DownloadHistory onDownload={onDownload} />);

    fireEvent.click(await screen.findByTestId("download-history-download-btn"));

    await waitFor(() => expect(onDownload).toHaveBeenCalledTimes(1));
    expect(onDownload.mock.calls[0][0]).toMatchObject({ uuid: "u-1" });
    expect(llamadas.some((l) => l.url.includes("/download"))).toBe(false);
  });

  /**
   * 🔴 CDT-75 — este caso fallaba 1 de cada 6 corridas de la suite completa, y
   * pasaba SIEMPRE en aislamiento (medido: 30 de 30 verdes).
   *
   * La falla era `expected 1 to be greater than 1`, y la causa es que esperaba
   * LA SEÑAL EQUIVOCADA. El intervalo de polling sólo se arma cuando el `items`
   * del componente ya tiene un reporte `pending`/`processing`
   * (`DownloadHistory.tsx:483-490`). Pero el `waitFor` esperaba a que se
   * REGISTRARA EL REQUEST, que es la red, no el estado: entre que la respuesta
   * se anota en `llamadas` y que React aplica el estado y corre el efecto hay
   * una ventana. Si el `advanceTimersByTimeAsync` caía adentro de esa ventana,
   * el intervalo todavía no existía y no salía ningún poll.
   *
   * ⚠️ Por eso pasaba en aislamiento: la ventana se abre bajo CARGA, cuando la
   * máquina está corriendo 137 archivos de test a la vez.
   *
   * El arreglo es esperar el ESTADO RENDERIZADO —la fila del reporte en
   * pantalla—, que sí prueba que `items` se aplicó y que el efecto corrió.
   * `shouldAdvanceTime: true` se queda: lo necesita `waitFor`, que usa
   * temporizadores propios.
   */
  it("sin reportes en curso NO hay polling; con uno pending, sí", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      vi.stubGlobal("fetch", mockFetch(llamadas));
      const { unmount } = render(<DownloadHistory pollIntervalMs={1000} />);
      // El estado, no la red: la fila pintada prueba que `items` se aplicó.
      await screen.findByTestId("download-history-item");
      const listadosQuietos = llamadas.filter((l) => l.url.includes("status=")).length;
      await vi.advanceTimersByTimeAsync(3500);
      // Todo completed: el intervalo no se arma, no hay requests de más.
      expect(llamadas.filter((l) => l.url.includes("status=")).length).toBe(
        listadosQuietos,
      );
      unmount();

      const conPendiente: Llamada[] = [];
      vi.stubGlobal(
        "fetch",
        mockFetch(conPendiente, [item({ status: "processing", progress: 40 })]),
      );
      render(<DownloadHistory pollIntervalMs={1000} initialStatus="all" />);
      // 🔴 ACÁ vivía el defecto: esto era `waitFor(() => elListado(...))`, o sea
      // la red. Ahora se espera la fila en pantalla, que es lo que garantiza
      // que el efecto del polling ya se armó.
      await screen.findByTestId("download-history-item");
      const antes = conPendiente.filter((l) => l.url.includes("status=")).length;
      await vi.advanceTimersByTimeAsync(3500);
      expect(
        conPendiente.filter((l) => l.url.includes("status=")).length,
      ).toBeGreaterThan(antes);
    } finally {
      vi.useRealTimers();
    }
  });

  it("un reporte que no está completed no se puede descargar", async () => {
    vi.stubGlobal("fetch", mockFetch(llamadas, [item({ status: "processing", progress: 40 })]));
    render(<DownloadHistory pollIntervalMs={0} />);

    const btn = await screen.findByTestId("download-history-download-btn");
    expect(btn).toBeDisabled();
  });
});
