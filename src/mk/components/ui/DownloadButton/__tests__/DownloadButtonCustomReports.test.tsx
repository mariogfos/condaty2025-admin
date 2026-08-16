/**
 * Fase 4b — reportes CUSTOM en el menú de exportar.
 *
 * Se renderiza el componente y se mira el menú, que es lo que ve el usuario.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import DownloadButton from "../DownloadButton";

/** Responde el endpoint de customs con `customs`; el resto, 202 vacío. */
function mockFetch(customs: unknown) {
  return vi.fn(async (url: unknown, _init?: RequestInit) => {
    const href = String(url);
    if (href.includes("/reports/custom")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: customs }),
      } as Response;
    }
    return {
      ok: true,
      status: 202,
      json: async () => ({ job_id: "job-1" }),
    } as Response;
  });
}

const abrirMenu = async () => {
  await act(async () => {
    fireEvent.click(screen.getByTestId("download-btn-payments"));
  });
};

const props = {
  type: "payments",
  params: {},
  supportedFormats: ["pdf", "xlsx", "csv"] as const,
};

describe("DownloadButton — reportes custom", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  /**
   * El botón es SOLO un ícono (S143e): sin `title`/`aria-label` no tiene
   * nombre accesible y queda mudo — ni tooltip para el que mira, ni etiqueta
   * para el lector de pantalla.
   *
   * Lo cubría `SprintS143eFeDownloadButton.test.ts` con un regex buscando
   * `title={title}` en el fuente. Se sacaron los dos atributos del JSX y, de
   * 772 tests, el único rojo fue ese pin (CDT-46, corte 4): era la única red,
   * así que se cambia por esto en vez de borrarse.
   */
  it("el botón de solo ícono tiene nombre accesible y tooltip", () => {
    vi.stubGlobal("fetch", mockFetch([]));

    render(<DownloadButton {...props} supportedFormats={["pdf"]} title="Exportar pagos" />);

    expect(screen.getByLabelText("Exportar pagos")).toBeTruthy();
    expect(
      screen.getByTestId("download-btn-payments").getAttribute("title"),
    ).toBe("Exportar pagos");
  });

  /**
   * Sin `supportedFormats` hay un solo formato: el botón exporta de un click
   * y NO abre menú.
   *
   * ⚠️ Esto NO mide el default `["pdf"]` del destructuring, y no puede: tres
   * líneas más abajo `handleExport(supportedFormats[0] ?? "pdf")` repite el
   * mismo fallback, así que cambiar el default a `[]` no cambia nada de lo
   * que se observa. `SprintS143eFeDownloadButton.test.ts` lo pineaba con un
   * regex sobre el fuente — o sea, pineaba una línea sin consecuencia.
   * Lo que sí importa, y es lo que se mide acá, es el formato que sale.
   */
  it("sin supportedFormats exporta pdf de un click, sin menú", async () => {
    const fetchMock = mockFetch([]);
    vi.stubGlobal("fetch", fetchMock);

    render(<DownloadButton type="payments" params={{}} />);
    await abrirMenu();

    expect(screen.queryByTestId("download-menu-payments")).toBeNull();
    await waitFor(() => {
      const exportCall = fetchMock.mock.calls.find((c) =>
        String(c[0]).includes("/export"),
      );
      expect(exportCall).toBeTruthy();
      expect(JSON.parse(String((exportCall![1] as any).body)).format).toBe("pdf");
    });
  });

  it("muestra el custom con su titulo, debajo de los formatos y arriba del historial", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch([{ key: "payments-income", label: "Reporte de Ingresos", formats: ["xlsx"] }]),
    );

    render(<DownloadButton {...props} supportedFormats={["pdf", "xlsx", "csv"]} />);
    await abrirMenu();

    const item = await screen.findByTestId("download-menuitem-payments-custom-payments-income");
    expect(item.textContent).toBe("Reporte de Ingresos");

    // El orden importa: formatos → custom → historial.
    const items = screen.getAllByRole("menuitem").map((n) => n.getAttribute("data-testid"));
    const iCsv = items.indexOf("download-menuitem-payments-csv");
    const iCustom = items.indexOf("download-menuitem-payments-custom-payments-income");
    const iHistorial = items.indexOf("download-menuitem-payments-history");
    expect(iCsv).toBeLessThan(iCustom);
    expect(iCustom).toBeLessThan(iHistorial);
  });

  it("con varios formatos abre una entrada por formato", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch([
        { key: "payments-income", label: "Reporte de Ingresos", formats: ["xlsx", "csv"] },
      ]),
    );

    render(<DownloadButton {...props} supportedFormats={["pdf", "xlsx", "csv"]} />);
    await abrirMenu();

    expect(
      (await screen.findByTestId("download-menuitem-payments-custom-payments-income-xlsx"))
        .textContent,
    ).toContain("Reporte de Ingresos");
    expect(
      screen.getByTestId("download-menuitem-payments-custom-payments-income-csv").textContent,
    ).toContain("CSV");
  });

  it("si el modulo no tiene customs, el menu queda igual que antes", async () => {
    vi.stubGlobal("fetch", mockFetch([]));

    render(<DownloadButton {...props} supportedFormats={["pdf", "xlsx", "csv"]} />);
    await abrirMenu();

    await waitFor(() => {
      expect(screen.getByTestId("download-menuitem-payments-history")).toBeTruthy();
    });
    expect(screen.queryByText(/Reporte de Ingresos/)).toBeNull();
  });

  it("dispara el custom con SU type, no con el del modulo", async () => {
    const fetchMock = mockFetch([
      { key: "payments-income", label: "Reporte de Ingresos", formats: ["xlsx"] },
    ]);
    vi.stubGlobal("fetch", fetchMock);

    render(<DownloadButton {...props} supportedFormats={["pdf", "xlsx", "csv"]} />);
    await abrirMenu();
    const item = await screen.findByTestId("download-menuitem-payments-custom-payments-income");
    await act(async () => {
      fireEvent.click(item);
    });

    await waitFor(() => {
      const urls = fetchMock.mock.calls.map((c) => String(c[0]));
      expect(urls.some((u) => u.includes("/v3/reports/payments-income/export"))).toBe(true);
    });
  });
  /**
   * 🔴 El bug que dejó el menú sin los customs: se leía
   * `localStorage.getItem("token")` a secas, pero la app guarda el token bajo
   * `NEXT_PUBLIC_AUTH_IAM + "token"` y DENTRO de un JSON. El request salía sin
   * Authorization → 401 → el `catch` devolvía [] → el menú se veía idéntico a
   * un módulo sin customs. Silencioso.
   */
  it("manda el token en el formato que guarda la app", async () => {
    const iam = process.env.NEXT_PUBLIC_AUTH_IAM ?? "";
    window.localStorage.setItem(iam + "token", JSON.stringify({ token: "abc123" }));

    const fetchMock = mockFetch([
      { key: "payments-income", label: "Reporte de Ingresos", formats: ["xlsx"] },
    ]);
    vi.stubGlobal("fetch", fetchMock);

    render(<DownloadButton {...props} supportedFormats={["pdf", "xlsx", "csv"]} />);
    await abrirMenu();

    await waitFor(() => {
      const llamada = fetchMock.mock.calls.find((c) =>
        String(c[0]).includes("/reports/custom"),
      );
      expect(llamada).toBeTruthy();
      const headers = llamada?.[1]?.headers as Record<string, string> | undefined;
      expect(headers?.Authorization).toBe("Bearer abc123");
    });

    window.localStorage.removeItem(iam + "token");
  });
});
