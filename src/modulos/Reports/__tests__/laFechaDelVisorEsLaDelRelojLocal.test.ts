import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { fechaLocalIso } from "../reportViewerState";

/**
 * «Hoy» en el visor de reportes es el día de quien mira, no el de Greenwich.
 *
 * `test` lo sacaba con `new Date().toISOString().slice(0, 10)`: la fecha en
 * UTC. En Bolivia (UTC−4), de las 20:00 a la medianoche eso es MAÑANA, así que
 * el estado de cuenta pedido a las 21:00 del 31 de diciembre salía con un rango
 * del 1 de enero del año viejo al 1 de enero del nuevo.
 *
 * ⚠️ El reloj se fija en La Paz: con la máquina en UTC las dos fechas
 * coinciden y el test no distinguiría nada.
 */
describe("la fecha del visor", () => {
  const zonaOriginal = process.env.TZ;

  beforeAll(() => {
    process.env.TZ = "America/La_Paz";
  });

  afterAll(() => {
    process.env.TZ = zonaOriginal;
  });

  it("a las 21:30 del 31 de diciembre sigue siendo 31 de diciembre", () => {
    const nochevieja = new Date(2026, 11, 31, 21, 30);

    // La contraprueba de que el reloj está donde creemos.
    expect(nochevieja.toISOString().slice(0, 10)).toBe("2027-01-01");

    expect(fechaLocalIso(nochevieja)).toBe("2026-12-31");
  });

  it("ni el visor ni Deudas vuelven a sacar la fecha de toISOString", () => {
    for (const archivo of [
      "src/modulos/Reports/ReportsPage.tsx",
      "src/modulos/DebtsManager/DebtsManager.tsx",
    ]) {
      const enCodigo = readFileSync(join(process.cwd(), archivo), "utf8")
        .split("\n")
        .filter((linea) => !/^\s*(\/\/|\*|\/\*)/.test(linea))
        .join("\n");

      expect(enCodigo, archivo).not.toMatch(/toISOString\(\)\.slice\(0,\s*10\)/);
    }
  });
});
