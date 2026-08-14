/**
 * CDT-43 — el día de la semana con el que se decide si HOY es un día
 * disponible del área.
 *
 * Acá vivían DOS errores que se cancelaban exactamente:
 *   1. el array arrancaba en "Lunes", pero `getDay()` devuelve 0 = domingo;
 *   2. `new Date("YYYY-MM-DD")` se parsea como medianoche UTC y en Bolivia
 *      (UTC-4) devuelve el día ANTERIOR.
 * Corrido +1 y corrido -1 daban el nombre correcto. Funcionaba, pero el
 * próximo que "arreglara" cualquiera de las dos mitades rompía la pantalla
 * sin tocar nada relacionado.
 *
 * Este test mide las dos mitades JUNTAS contra el array real del módulo:
 * si alguna vuelve a correrse, se pone en rojo.
 *
 * La zona se fija acá y se ANCLA con el offset: sin el ancla el test pasaría
 * en cualquier zona horaria y no mediría nada.
 */
process.env.TZ = "America/La_Paz";

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { diaDeLaSemanaDe } from "../CreateReserva";
import { getNow } from "@/mk/utils/date";

// Exactamente lo que hace nextStep(): el resolver REAL del módulo.
const diaDeHoy = () => diaDeLaSemanaDe(getNow());

const anclarLaFranja = (instante: string) => {
  vi.setSystemTime(new Date(instante));
  expect(new Date().getTimezoneOffset()).toBe(240);
};

describe("CDT-43 · el día de la semana de HOY en CreateReserva", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  // Los dos extremos del array: un corrimiento en cualquier dirección se ve acá.
  describe("domingo (índice 0) y lunes (índice 1)", () => {
    it("domingo 2026-08-09 al mediodía", () => {
      anclarLaFranja("2026-08-09T16:00:00Z");
      expect(diaDeHoy()).toBe("Domingo");
    });

    it("domingo 2026-08-09 a las 22:00 (en UTC ya es lunes)", () => {
      anclarLaFranja("2026-08-10T02:00:00Z");
      expect(new Date().toISOString().split("T")[0]).toBe("2026-08-10");
      expect(diaDeHoy()).toBe("Domingo");
    });

    it("lunes 2026-08-10 al mediodía", () => {
      anclarLaFranja("2026-08-10T16:00:00Z");
      expect(diaDeHoy()).toBe("Lunes");
    });

    it("lunes 2026-08-10 a las 22:00 (en UTC ya es martes)", () => {
      anclarLaFranja("2026-08-11T02:00:00Z");
      expect(new Date().toISOString().split("T")[0]).toBe("2026-08-11");
      expect(diaDeHoy()).toBe("Lunes");
    });
  });

  it("los 7 días de la semana, al mediodía y a las 22:00", () => {
    const semana = [
      ["2026-08-09", "Domingo"],
      ["2026-08-10", "Lunes"],
      ["2026-08-11", "Martes"],
      ["2026-08-12", "Miércoles"],
      ["2026-08-13", "Jueves"],
      ["2026-08-14", "Viernes"],
      ["2026-08-15", "Sábado"],
    ];

    for (const [fecha, esperado] of semana) {
      // mediodía local = 16:00 UTC; 22:00 local = 02:00 UTC del día siguiente.
      anclarLaFranja(`${fecha}T16:00:00Z`);
      expect(diaDeHoy()).toBe(esperado);

      const siguiente = new Date(`${fecha}T00:00:00Z`);
      siguiente.setUTCDate(siguiente.getUTCDate() + 1);
      anclarLaFranja(`${siguiente.toISOString().split("T")[0]}T02:00:00Z`);
      expect(diaDeHoy()).toBe(esperado);
    }
  });

  it("las cadenas coinciden con las de available_days (con acentos)", () => {
    // Las elige el admin en Areas/RenderForm/Partes/SecondPart.tsx.
    const available_days = ["Miércoles", "Sábado"];

    anclarLaFranja("2026-08-12T16:00:00Z"); // miércoles
    expect(available_days.includes(diaDeHoy())).toBe(true);

    anclarLaFranja("2026-08-15T16:00:00Z"); // sábado
    expect(available_days.includes(diaDeHoy())).toBe(true);

    anclarLaFranja("2026-08-14T16:00:00Z"); // viernes: no está disponible
    expect(available_days.includes(diaDeHoy())).toBe(false);
  });
});
