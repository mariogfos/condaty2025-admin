import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { API_STATUS_LABELS } from "../config/assemblies.constants";
import { STATUS_LABELS } from "../types/assemblies.types";

/**
 * Las asambleas tienen UNA tabla de etiquetas de estado, no dos (2026-08-08).
 *
 * ## 🔴 Por qué existe
 *
 * Había dos, y no decían lo mismo. `config/assemblies.constants.ts` traía
 * `C: "Finalizada"` —el cambio de producto— y `types/assemblies.types.ts` se
 * había quedado en `C: "Completada"`. Cada componente importaba de donde le
 * quedaba más cerca, así que **la misma asamblea se leía distinta según la
 * pantalla**: "Finalizada" en el detalle y en la lista, "Completada" en la
 * tarjeta del dashboard y en el botón de cambiar estado.
 *
 * ⚠️ Y había un test pineando "Completada". Ése es el caso peor: un pin sobre
 * la decisión equivocada hace que corregirla parezca la rotura.
 *
 * Es el mismo patrón que ya se pagó en `DebtStatus` (tres tablas parciales) y
 * en las invitaciones (cuatro tablas de tipos). Una política escrita en N
 * lugares son N valores que coinciden hasta que dejan de coincidir.
 */
describe("Asambleas: una sola tabla de etiquetas de estado", () => {
  it("las dos exportaciones son literalmente el mismo objeto", () => {
    expect(
      STATUS_LABELS,
      "`STATUS_LABELS` volvió a ser una tabla propia en vez de re-exportar la " +
        "de `assemblies.constants`. Dos tablas divergen: ya pasó."
    ).toBe(API_STATUS_LABELS);
  });

  it("el estado C se llama Finalizada en todos lados", () => {
    expect(STATUS_LABELS.C).toBe("Finalizada");
    expect(API_STATUS_LABELS.C).toBe("Finalizada");
  });

  /**
   * ⚠️ Source-parsing a propósito: el test de arriba pasaría igual si alguien
   * escribiera una tabla nueva idéntica. Lo que hay que impedir es que EXISTA
   * una segunda definición, no que hoy coincidan.
   */
  it("types.ts no define su propia tabla de etiquetas", () => {
    const fuente = fs.readFileSync(
      path.join(__dirname, "..", "types", "assemblies.types.ts"),
      "utf-8"
    );

    expect(
      fuente,
      "`assemblies.types.ts` volvió a declarar `STATUS_LABELS` en vez de " +
        "re-exportarla. Aunque hoy diga lo mismo, mañana no."
    ).not.toMatch(/export const STATUS_LABELS/);
  });

  /**
   * Y las claves cubren los cuatro estados que manda el back
   * (`App\Modules\Assemblies\Enums\AssemblyStatus`: S, P, C, X).
   */
  it("cubre los cuatro estados del back", () => {
    expect(Object.keys(STATUS_LABELS).sort()).toEqual(["C", "P", "S", "X"]);
  });
});
