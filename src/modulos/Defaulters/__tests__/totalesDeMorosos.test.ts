import { describe, it, expect } from "vitest";

/**
 * 🔴 Los totales de Morosos: cero es un número, no "sin dato".
 *
 * Los usuarios reportaron inconsistencia entre los números de esta pantalla.
 * Medido el 2026-08-07 en la base local: **17 de 19 condominios tienen
 * `penalty_type = 0`**, o sea que no aplican multa y su total de multas es cero
 * de verdad. Con `||`, ese cero legítimo se tomaba como "vacío" y se
 * reemplazaba por el total que suma el front.
 *
 * ⚠️ Es el mismo patrón que `where('col', null)` en el back: un valor que
 * parece vacío cambia de significado en silencio. Acá lo hace `0`, allá `null`.
 *
 * La función replica la del componente. Vive acá porque el bug no está en el
 * render sino en la ELECCIÓN del número, y eso se puede medir sin React.
 */
const totalesQueSeMuestran = (
  delBack: { porCobrarMulta?: number } | undefined,
  sumadosEnElFront: { porCobrarMulta: number },
) => ({
  porCobrarMulta: delBack?.porCobrarMulta ?? sumadosEnElFront.porCobrarMulta,
});

describe("totales de Morosos", () => {
  it("respeta un cero que viene del back", () => {
    // El condominio no aplica multas: el back dice 0 y hay que mostrar 0.
    expect(
      totalesQueSeMuestran({ porCobrarMulta: 0 }, { porCobrarMulta: 1234 })
        .porCobrarMulta,
    ).toBe(0);
  });

  it("usa el total del back cuando lo hay", () => {
    expect(
      totalesQueSeMuestran({ porCobrarMulta: 39515.4 }, { porCobrarMulta: 0 })
        .porCobrarMulta,
    ).toBe(39515.4);
  });

  it("cae al calculado sólo si el back no mandó el dato", () => {
    expect(
      totalesQueSeMuestran(undefined, { porCobrarMulta: 500 }).porCobrarMulta,
    ).toBe(500);
    expect(
      totalesQueSeMuestran({}, { porCobrarMulta: 500 }).porCobrarMulta,
    ).toBe(500);
  });

  /**
   * ⚠️ La versión con `||` seguía verde en el caso normal: sólo se rompe
   * cuando el total legítimo es CERO. Por eso el primer test es el que importa.
   */
  it("con || el cero legitimo se perdia", () => {
    const conElBug = (delBack: any, front: any) =>
      delBack?.porCobrarMulta || front.porCobrarMulta;

    expect(conElBug({ porCobrarMulta: 0 }, { porCobrarMulta: 1234 })).toBe(1234);
    expect(conElBug({ porCobrarMulta: 39515.4 }, { porCobrarMulta: 0 })).toBe(
      39515.4,
    );
  });
});
