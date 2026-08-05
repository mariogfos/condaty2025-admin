/**
 * "Limpiar historial" borra SÓLO el módulo seleccionado.
 *
 * 🔴 Reportado por Mario, 2026-08-04: parado en Ingresos, el botón le borraba
 * también los reportes de Egresos. El botón vive AL LADO del dropdown
 * "Módulo", así que ignorar el filtro que el usuario está mirando no es un
 * borrado: es una sorpresa, y no tiene deshacer.
 *
 * ⚠️ Los tests que ya cubrían este botón leían el CÓDIGO FUENTE con regex
 * (`Sprint119...Pin.test.tsx`): verificaban que el `fetch` dijera
 * `method: "DELETE"`. Eso era cierto, y el botón borraba de más igual. Acá se
 * renderiza el componente y se mira la request que sale.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import DownloadHistory from "../DownloadHistory";

const TYPES = {
  success: true,
  data: ["payments", "outlays"],
  options: [
    { type: "payments", label: "Ingresos" },
    { type: "outlays", label: "Egresos" },
  ],
};

// ⚠️ Con la lista vacía el botón "Limpiar" NO se renderiza (`items.length > 0`),
// así que el historial tiene que traer algo o el test no mide nada.
const LISTA = {
  success: true,
  data: [
    {
      uuid: "u-1",
      type: "payments",
      name: "Ingresos",
      format: "pdf",
      status: "completed",
      progress: 100,
      download_url: "/api/v3/reports/u-1/download",
      created_at: "2026-08-04T20:00:00-04:00",
    },
  ],
  total: 1,
  page: 1,
  perPage: 20,
};

/** Guarda cada request que sale, para poder mirar la del DELETE. */
function mockFetch(llamadas: Array<{ url: string; method?: string }>) {
  return vi.fn(async (url: unknown, init?: any) => {
    const href = String(url);
    llamadas.push({ url: href, method: init?.method });
    const payload = href.includes("/reports/types")
      ? TYPES
      : init?.method === "DELETE"
        ? { success: true, deleted_reports: 1, deleted_files: 1 }
        : LISTA;
    return { ok: true, status: 200, json: async () => payload } as Response;
  });
}

async function limpiarHistorial() {
  fireEvent.click(await screen.findByLabelText("Limpiar historial"));
  fireEvent.click(await screen.findByText("Sí, limpiar"));
}

describe("DownloadHistory — limpiar respeta el módulo seleccionado", () => {
  let llamadas: Array<{ url: string; method?: string }>;

  beforeEach(() => {
    llamadas = [];
    vi.stubGlobal("fetch", mockFetch(llamadas));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("con un modulo seleccionado, el DELETE lleva ese type", async () => {
    render(<DownloadHistory initialType="payments" />);

    await limpiarHistorial();

    await waitFor(() => {
      const del = llamadas.find((l) => l.method === "DELETE");
      expect(del).toBeTruthy();
      expect(del!.url).toContain("type=payments");
    });
  });

  it("sin modulo seleccionado, el DELETE no lleva type y borra todo", async () => {
    render(<DownloadHistory />);

    await limpiarHistorial();

    await waitFor(() => {
      const del = llamadas.find((l) => l.method === "DELETE");
      expect(del).toBeTruthy();
      expect(del!.url).not.toContain("type=");
    });
  });

  /**
   * Lo que el modal promete tiene que ser lo que el botón hace. Un cartel que
   * dice "todos los reportes" cuando va a borrar uno solo —o al revés— es tan
   * peligroso como el bug.
   */
  it("el modal avisa que solo se borra el modulo seleccionado", async () => {
    render(<DownloadHistory initialType="outlays" />);

    fireEvent.click(await screen.findByLabelText("Limpiar historial"));

    // La palabra "Egresos" sola también está en el dropdown: se busca la
    // frase del modal, que es la que le promete algo al usuario.
    expect(
      await screen.findByText(/Los de otros módulos no se tocan/),
    ).toBeTruthy();
    expect(screen.queryByText(/TODOS los módulos/)).toBeNull();
  });
});
