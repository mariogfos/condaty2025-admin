/**
 * Reemplaza a `S116bAsyncExportButtonHistoryShortcut.test.tsx` y al segundo
 * `describe` de `Sprint119DownloadHistoryModuloFilterAndClearPin.test.tsx`
 * (CDT-46, corte 4). Los dos leían `AsyncExportButton.tsx` con regex.
 *
 * Lo que importa acá lo ve el usuario: que el botón "Historial" esté, que
 * abra el modal, y que el modal arranque filtrado por el módulo desde el
 * que se abrió — si arranca en "Todos", el usuario ve reportes de otros
 * módulos y cree que el suyo no se generó.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AsyncExportButton from "../AsyncExportButton";

vi.mock("@/mk/hooks/useToast", () => ({
  default: () => ({ showToast: vi.fn() }),
}));

const TYPES = {
  success: true,
  data: ["outlays", "payments"],
  options: [
    { type: "outlays", label: "Egresos" },
    { type: "payments", label: "Ingresos" },
  ],
};

type Llamada = { url: string; init: any };

describe("AsyncExportButton — el atajo al historial", () => {
  let llamadas: Llamada[];

  beforeEach(() => {
    llamadas = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: unknown, init?: any) => {
        const href = String(url);
        llamadas.push({ url: href, init });
        return {
          ok: true,
          status: 200,
          json: async () =>
            href.includes("/reports/types")
              ? TYPES
              : { success: true, data: [], meta: { total: 0 } },
        } as Response;
      }),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("el botón Historial abre el modal filtrado por el módulo de origen", async () => {
    render(
      <AsyncExportButton type="outlays" label="Exportar egresos" params={{}} />,
    );

    fireEvent.click(screen.getByTestId("async-history-btn-outlays"));

    // El listado que sale al abrir el modal ya viene filtrado: es lo único
    // que distingue "abrí el historial de Egresos" de "abrí el historial".
    await waitFor(() => {
      const listado = llamadas.find((l) => l.url.includes("status="));
      expect(listado).toBeTruthy();
      expect(
        new URL(listado!.url, "http://front.test").searchParams.get("type"),
      ).toBe("outlays");
    });
  });

  it("con showHistoryShortcut en false el botón no está", () => {
    render(
      <AsyncExportButton
        type="outlays"
        label="Exportar egresos"
        params={{}}
        showHistoryShortcut={false}
      />,
    );

    expect(screen.getByTestId("async-export-btn-outlays")).toBeTruthy();
    expect(screen.queryByTestId("async-history-btn-outlays")).toBeNull();
  });

  it("el historial y el modal de progreso son independientes", async () => {
    render(
      <AsyncExportButton type="outlays" label="Exportar egresos" params={{}} />,
    );

    // Abrir el historial no puede disparar el export ni abrir el progreso.
    fireEvent.click(screen.getByTestId("async-history-btn-outlays"));

    await waitFor(() =>
      expect(llamadas.some((l) => l.url.includes("status="))).toBe(true),
    );
    expect(llamadas.some((l) => l.url.includes("/export"))).toBe(false);
  });
});
