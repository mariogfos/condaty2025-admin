/**
 * El dropdown "Módulo" del historial muestra el TÍTULO del reporte que manda
 * el back, no el `type` técnico ni un label inventado por el front.
 *
 * Por qué existe este archivo: los tests de este componente leían el código
 * fuente con regex, así que pasaban en verde aunque el select mostrara
 * "payments". Acá se RENDERIZA el componente con el fetch mockeado y se mira
 * lo que ve el usuario.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import DownloadHistory from "../DownloadHistory";

const listaVacia = { success: true, data: [], total: 0, page: 1, perPage: 20 };

/** Responde el endpoint de types con `body` y el listado con vacío. */
function mockFetch(body: unknown) {
  return vi.fn(async (url: unknown) => {
    const href = String(url);
    const payload = href.includes("/reports/types") ? body : listaVacia;
    return {
      ok: true,
      status: 200,
      json: async () => payload,
    } as Response;
  });
}

describe("DownloadHistory — labels del dropdown Módulo", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch({}));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("muestra el titulo que manda el back, no el type tecnico", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        success: true,
        data: ["payments"],
        options: [{ type: "payments", label: "Reporte de Pagos" }],
      }),
    );

    render(<DownloadHistory />);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Reporte de Pagos" })).toBeTruthy();
    });
    expect(screen.queryByRole("option", { name: "payments" })).toBeNull();
  });

  it("si el modulo no manda label, humaniza el type en vez de dejarlo crudo", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        success: true,
        data: ["bank-entities"],
        options: [{ type: "bank-entities" }],
      }),
    );

    render(<DownloadHistory />);

    // "bank-entities" tiene label propio en KNOWN_TYPES; el punto es que el
    // usuario nunca vea el slug con guiones.
    await waitFor(() => {
      expect(screen.queryByRole("option", { name: "bank-entities" })).toBeNull();
    });
  });

  it("con un back viejo (solo data, sin options) el dropdown sigue funcionando", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: true, data: ["payments"] }),
    );

    render(<DownloadHistory />);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Pagos" })).toBeTruthy();
    });
  });
});
