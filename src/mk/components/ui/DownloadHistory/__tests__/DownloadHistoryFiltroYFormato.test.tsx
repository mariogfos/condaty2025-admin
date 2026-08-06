/**
 * Los tres arreglos del historial de descargas (2026-08-06, los reportó Mario
 * usando el módulo de Bitácoras).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import DownloadHistory from "../DownloadHistory";

const unReporte = (over: Record<string, any> = {}) => ({
  uuid: "r-" + Math.random().toString(36).slice(2),
  type: "guard_news",
  name: "Reporte de Bitácora",
  format: "pdf",
  status: "completed",
  created_at: "2026-08-06T12:00:00Z",
  size_bytes: 2048,
  download_url: "/x",
  ...over,
});

/** Devuelve las URLs con las que se llamó a `/v3/reports`. */
const pedidosDeLista = (): string[] =>
  (globalThis.fetch as any).mock.calls
    .map((c: any[]) => String(c[0]))
    .filter((u: string) => u.includes("/v3/reports?"));

const montarCon = (opciones: Array<{ type: string; label: string }>, items: any[]) => {
  globalThis.fetch = vi.fn(async (url: any) => {
    const u = String(url);
    if (u.includes("/v3/reports/types")) {
      return { ok: true, status: 200, json: async () => ({ options: opciones }) } as any;
    }
    const filtrado = new URL(u, "http://x").searchParams.get("type");
    const data = filtrado ? items.filter((i) => i.type === filtrado) : items;
    return {
      ok: true,
      status: 200,
      json: async () => ({ data, meta: { total: data.length } }),
    } as any;
  }) as any;
};

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("historial de descargas", () => {
  /**
   * 🔴 El bug: se abría mostrando "Todos" en el select y la lista VACÍA, y
   * había que elegir el módulo y volver a "Todos" para ver algo.
   *
   * Pasaba cuando el `type` que manda el parent no es el que el back usa para
   * guardar el reporte: quedaba filtrando por un type sin filas, y como
   * tampoco figura entre las opciones del back, el select no tenía qué marcar
   * y mostraba "Todos". El filtro decía una cosa y la consulta hacía otra.
   */
  it("un type que el back no conoce se descarta y muestra todos", async () => {
    montarCon(
      [{ type: "guard_news", label: "Reporte de Bitácora" }],
      [unReporte(), unReporte({ type: "users", name: "Reporte de Personal" })],
    );

    // 'guard-news' con guion medio: la clave vieja, que ya no existe.
    render(<DownloadHistory initialType="guard-news" pollIntervalMs={0} />);

    await waitFor(() => {
      expect(screen.getAllByTestId("download-history-item").length).toBe(2);
    });

    // Y el último pedido NO lleva el type fantasma.
    const ultimo = pedidosDeLista().at(-1)!;
    expect(ultimo).not.toContain("type=guard-news");
  });

  /** Un type que el back SÍ conoce se respeta: no rompemos el filtrado. */
  it("un type conocido se mantiene", async () => {
    montarCon(
      [
        { type: "guard_news", label: "Reporte de Bitácora" },
        { type: "users", label: "Reporte de Personal" },
      ],
      [unReporte(), unReporte({ type: "users", name: "Reporte de Personal" })],
    );

    render(<DownloadHistory initialType="guard_news" pollIntervalMs={0} />);

    await waitFor(() => {
      expect(screen.getAllByTestId("download-history-item").length).toBe(1);
    });
    expect(pedidosDeLista().at(-1)).toContain("type=guard_news");
  });

  /**
   * 🔴 Dos reportes del mismo módulo se veían idénticos y no había forma de
   * saber cuál era el PDF y cuál el Excel.
   */
  it("cada reporte dice de qué formato es", async () => {
    montarCon(
      [{ type: "outlays", label: "Reporte de Egresos" }],
      [
        unReporte({ type: "outlays", name: "Reporte de Egresos", format: "pdf" }),
        unReporte({ type: "outlays", name: "Reporte de Egresos", format: "xlsx" }),
        unReporte({ type: "outlays", name: "Reporte de Egresos", format: "csv" }),
        // `excel` es el mismo archivo que `xlsx` con otro nombre: los
        // reportes viejos lo tienen así y no pueden mostrarse distinto.
        unReporte({ type: "outlays", name: "Reporte de Egresos", format: "excel" }),
      ],
    );

    render(<DownloadHistory pollIntervalMs={0} />);

    await waitFor(() => {
      expect(screen.getAllByTestId("download-history-item").length).toBe(4);
    });

    const formatos = screen
      .getAllByTestId("download-history-item-format")
      .map((n) => n.textContent);

    expect(formatos).toEqual(["PDF", "XLSX", "CSV", "XLSX"]);
  });
});
