/**
 * El título del Balance para cada período, con el reloj fijo.
 *
 * 🔴 «Ayer» decía un día de enero de 1970: `new Date(now.getDate() - 1)`
 * tomaba el número del día como milisegundos. Los bordes que importan son los
 * que cruzan de mes y de año —el 1 de enero y el 1 de marzo— y el domingo, que
 * la cuenta vieja de la semana ponía en la semana siguiente.
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
  describe("«Ayer» (ld)", () => {
    it("el 1 de enero es el 31 de diciembre del año anterior", () => {
      expect(balancePeriodLabel("ld", at(2026, 1, 1))).toBe(
        "Balance del 31 de Diciembre de 2025",
      );
    });

    it("el 1 de marzo es el último día de febrero", () => {
      expect(balancePeriodLabel("ld", at(2026, 3, 1))).toBe(
        "Balance del 28 de Febrero de 2026",
      );
      expect(balancePeriodLabel("ld", at(2028, 3, 1))).toBe(
        "Balance del 29 de Febrero de 2028",
      );
    });

    it("un día cualquiera es el día anterior, no 1970", () => {
      expect(balancePeriodLabel("ld", at(2026, 9, 28))).toBe(
        "Balance del 27 de Septiembre de 2026",
      );
    });
  });

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

  describe("semanas, de lunes a domingo", () => {
    it("un domingo pertenece a la semana que termina ese día", () => {
      // 2026-03-01 es domingo.
      expect(balancePeriodLabel("w", at(2026, 3, 1))).toBe(
        "Balance desde 23 de Febrero hasta 1 de Marzo de 2026",
      );
      expect(balancePeriodLabel("lw", at(2026, 3, 1))).toBe(
        "Balance desde 16 de Febrero hasta 22 de Febrero de 2026",
      );
    });

    it("la semana del 1 de enero cruza de año", () => {
      // 2026-01-01 es jueves.
      expect(balancePeriodLabel("w", at(2026, 1, 1))).toBe(
        "Balance desde 29 de Diciembre hasta 4 de Enero de 2026",
      );
      expect(balancePeriodLabel("lw", at(2026, 1, 1))).toBe(
        "Balance desde 22 de Diciembre hasta 28 de Diciembre de 2025",
      );
    });
  });

  it("«Hoy», «Este mes», «Este año» y «Año anterior»", () => {
    const now = at(2026, 1, 1);
    expect(balancePeriodLabel("d", now)).toBe("Balance del 1 de Enero de 2026");
    expect(balancePeriodLabel("m", now)).toBe("Balance de Enero de 2026");
    expect(balancePeriodLabel("y", now)).toBe(
      "Balance desde Enero hasta Enero de 2026",
    );
    expect(balancePeriodLabel("ly", now)).toBe(
      "Balance desde Enero hasta Diciembre de 2025",
    );
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
