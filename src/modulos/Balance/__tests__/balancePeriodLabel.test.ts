/**
 * El título del Balance para cada período, con el reloj fijo.
 *
 * Sólo los períodos del selector: `d`, `ld`, `w` y `lw` son un 422 en el API.
 * Los bordes que importan son los que cruzan de año —«Mes anterior» en enero—
 * y el 31 de marzo, donde restar un mes desborda.
 *
 * Los `Date` se arman con la hora LOCAL a mediodía: el título se calcula con
 * `getDate()`/`getMonth()`, así que ningún huso cambia el día.
 *
 * El huso del archivo es Bogotá (UTC-5) a propósito: al oeste del `-04:00`
 * que el título del personalizado tenía escrito a mano, que corría el día de
 * fin al anterior.
 */
process.env.TZ = "America/Bogota";

import { describe, it, expect } from "vitest";
import { balancePeriodLabel } from "../balancePeriodLabel";

const at = (year: number, month: number, day: number) =>
  new Date(year, month - 1, day, 12, 0, 0);

describe("balancePeriodLabel", () => {
  describe("«Mes anterior» (lm)", () => {
    it("en enero es diciembre del año anterior", () => {
      expect(balancePeriodLabel("lm", at(2026, 1, 1))).toBe(
        "Balance de Diciembre de 2025",
      );
    });

    it("el 31 de marzo es febrero", () => {
      expect(balancePeriodLabel("lm", at(2026, 3, 31))).toBe(
        "Balance de Febrero de 2026",
      );
    });
  });

  it("«Este mes», «Este año» y «Año anterior»", () => {
    const now = at(2026, 1, 1);
    expect(balancePeriodLabel("m", now)).toBe("Balance de Enero de 2026");
    expect(balancePeriodLabel("y", now)).toBe(
      "Balance desde Enero hasta Enero de 2026",
    );
    expect(balancePeriodLabel("ly", now)).toBe(
      "Balance desde Enero hasta Diciembre de 2025",
    );
  });

  it("un período que el selector no ofrece es el título genérico", () => {
    for (const period of ["d", "ld", "w", "lw", "T"]) {
      expect(balancePeriodLabel(period, at(2026, 9, 28))).toBe("Balance general");
    }
  });

  describe("«Personalizado»", () => {
    it("dice los días elegidos, sin correrlos por el huso", () => {
      expect(balancePeriodLabel("c:2026-07-01,2026-07-31", at(2026, 9, 28))).toBe(
        "Balance desde 1 de Julio de 2026 hasta 31 de Julio de 2026",
      );
      expect(balancePeriodLabel("c:2026-01-01,2026-12-31", at(2026, 9, 28))).toBe(
        "Balance desde 1 de Enero de 2026 hasta 31 de Diciembre de 2026",
      );
    });

    it("sin rango todavía (el modal abierto) es el título genérico", () => {
      expect(balancePeriodLabel("sc", at(2026, 9, 28))).toBe("Balance general");
      expect(balancePeriodLabel("c:2026-07-01", at(2026, 9, 28))).toBe(
        "Balance general",
      );
    });
  });
});
