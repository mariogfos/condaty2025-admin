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
function mockFetch(
  llamadas: Array<{ url: string; method?: string; init?: any }>,
) {
  return vi.fn(async (url: unknown, init?: any) => {
    const href = String(url);
    llamadas.push({ url: href, method: init?.method, init });
    const payload = href.includes("/reports/types")
      ? TYPES
      : init?.method === "DELETE"
        ? { success: true, deleted_reports: 1, deleted_files: 1 }
        : LISTA;
    return { ok: true, status: 200, json: async () => payload } as Response;
  });
}

/**
 * 🔴 `NewModal` deja su contenido MONTADO con `visibility: hidden` cuando está
 * cerrado (S127, a propósito: `{open && children}` desmontaba el árbol). Eso
 * significa que `findByText("Sí, limpiar")` encuentra el botón aunque el modal
 * nunca se haya abierto, y `fireEvent.click` lo aprieta igual. Sin el
 * `toBeVisible()` de abajo, este helper "confirma" contra un modal cerrado y
 * el paso de confirmación deja de medirse. Medido en CDT-46, corte 4.
 */
async function limpiarHistorial() {
  fireEvent.click(await screen.findByLabelText("Limpiar historial"));
  const confirmar = await screen.findByText("Sí, limpiar");
  expect(confirmar).toBeVisible();
  fireEvent.click(confirmar);
}

describe("DownloadHistory — limpiar respeta el módulo seleccionado", () => {
  let llamadas: Array<{ url: string; method?: string; init?: any }>;

  beforeEach(() => {
    llamadas = [];
    localStorage.setItem(
      (process.env.NEXT_PUBLIC_AUTH_IAM as string) + "token",
      JSON.stringify({ token: "tok-123" }),
    );
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

  /**
   * CDT-46 (corte 4): lo cubría `Sprint119...Pin.test.tsx` leyendo el fuente
   * con un regex sobre `handleClear`. Sin el Bearer el back devuelve 401 y el
   * historial NO se borra, pero el botón igual cierra el modal: el usuario se
   * va creyendo que borró.
   */
  it("el DELETE lleva el Bearer del localStorage y credentials: include", async () => {
    render(<DownloadHistory />);

    await limpiarHistorial();

    await waitFor(() => {
      const del = llamadas.find((l) => l.method === "DELETE");
      expect(del).toBeTruthy();
      expect(del!.init.headers.Authorization).toBe("Bearer tok-123");
      expect(del!.init.credentials).toBe("include");
    });
  });

  /**
   * El borrado no tiene deshacer: el click en el tacho abre el modal, y NADA
   * más. Lo cubría el pin de S119 mirando que en el fuente estuvieran escritos
   * `<NewModal` y `onSave={handleClear}` — los dos siguen escritos aunque el
   * botón dispare el DELETE derecho, que es como se comprobó (CDT-46, corte 4)
   * que ese pin no podía ponerse rojo.
   */
  it("el DELETE no sale hasta que el usuario confirma", async () => {
    render(<DownloadHistory />);

    fireEvent.click(await screen.findByLabelText("Limpiar historial"));
    // Un ciclo de eventos: si el click disparara el DELETE, ya habría salido.
    await new Promise((r) => setTimeout(r, 0));
    expect(llamadas.find((l) => l.method === "DELETE")).toBeUndefined();

    fireEvent.click(await screen.findByText("Sí, limpiar"));
    await waitFor(() =>
      expect(llamadas.find((l) => l.method === "DELETE")).toBeTruthy(),
    );
  });

  /**
   * S143e lo dejó solo-ícono: sin `aria-label`/`title` el botón queda mudo
   * (ni tooltip ni lector de pantalla), y con el texto de vuelta rompe el
   * layout compacto de la barra. Lo cubrían dos regex del fuente en
   * `SprintS143eFeDownloadButton.test.ts`.
   */
  it("el botón de limpiar es solo ícono y tiene nombre accesible", async () => {
    render(<DownloadHistory />);

    const btn = await screen.findByLabelText("Limpiar historial");
    expect(btn.getAttribute("title")).toBe("Limpiar historial");
    expect(btn.textContent).toBe("");
  });

  it("con hideClearButton no hay botón de limpiar", async () => {
    render(<DownloadHistory hideClearButton />);

    // El listado ya cargó (el ítem está en pantalla), así que la ausencia
    // del botón no es "todavía no renderizó".
    expect(await screen.findByTestId("download-history-item")).toBeTruthy();
    expect(screen.queryByLabelText("Limpiar historial")).toBeNull();
  });

  it("al terminar, avisa al parent cuántos borró", async () => {
    const onClearCompleted = vi.fn();
    render(<DownloadHistory onClearCompleted={onClearCompleted} />);

    await limpiarHistorial();

    await waitFor(() => expect(onClearCompleted).toHaveBeenCalledTimes(1));
    expect(onClearCompleted).toHaveBeenCalledWith(1, 1);
  });
});
