import { describe, expect, it } from "vitest";
import { formatQrDate } from "../shared";

/**
 * La tabla mostraba "Invalid Date" en Fecha orden y Vencimiento.
 *
 * El API manda las fechas en ISO con hora porque el modelo las castea, y el
 * formateador le pegaba "T00:00:00" al string entero: `Date` no sabe leer
 * "2026-09-10T00:00:00.000000ZT00:00:00".
 */
describe("formatQrDate", () => {
  it("lee la fecha ISO con hora que manda el API", () => {
    expect(formatQrDate("2026-09-10T00:00:00.000000Z")).toContain("10");
    expect(formatQrDate("2026-09-10T00:00:00.000000Z")).not.toMatch(/Invalid/i);
  });

  it("lee también una fecha sin hora", () => {
    expect(formatQrDate("2026-09-10")).not.toMatch(/Invalid/i);
  });

  it("no corre el día por la zona horaria", () => {
    // `new Date("2026-01-01")` es medianoche UTC, que en La Paz es el 31 de
    // diciembre: el día se mostraría uno para atrás.
    const d = new Date(2026, 0, 1);
    expect(formatQrDate("2026-01-01T00:00:00.000000Z")).toBe(
      d.toLocaleDateString("es-BO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    );
  });

  it("dice — cuando no hay fecha", () => {
    expect(formatQrDate(null)).toBe("—");
    expect(formatQrDate(undefined)).toBe("—");
    expect(formatQrDate("")).toBe("—");
  });

  it("no rompe con una fecha que no se puede leer", () => {
    expect(formatQrDate("no-es-una-fecha")).toBe("—");
  });

  it("acepta el mes largo para la ficha", () => {
    const corto = formatQrDate("2026-09-10T00:00:00.000000Z", "short");
    const largo = formatQrDate("2026-09-10T00:00:00.000000Z", "long");
    expect(largo.length).toBeGreaterThan(corto.length);
  });
});
