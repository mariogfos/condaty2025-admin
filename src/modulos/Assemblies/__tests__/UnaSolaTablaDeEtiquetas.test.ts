import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { AssemblyStatus } from "../types/assemblies.types";
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

  it("el estado Finalizada se llama Finalizada en todos lados", () => {
    expect(STATUS_LABELS[AssemblyStatus.Completed]).toBe("Finalizada");
    expect(API_STATUS_LABELS[AssemblyStatus.Completed]).toBe("Finalizada");
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
   * 🔴🔴 `assemblies.constants.ts` NO importa de `assemblies.types.ts`.
   *
   * Es el bug que costó más caro del flip a numérico del 2026-08-27.
   * `assemblies.types.ts` **re-exporta** `STATUS_LABELS` desde
   * `assemblies.constants.ts`; si `constants` importa el enum desde `types`, el
   * ciclo se cierra. Al evaluar `constants` el enum todavía vale `undefined` y
   * las cuatro claves computadas colapsan en una sola: `{ "undefined": … }`.
   * Por eso el enum vive en `types/assemblyStatus.ts`, que no importa a nadie.
   *
   * ⚠️ **`tsc` no lo ve**: el ciclo compila sin una queja y revienta al
   * ejecutar.
   *
   * 🔴 Y la primera versión de este caso —afirmar en runtime que ninguna clave
   * es `"undefined"`— **quedó VERDE con el ciclo reinyectado**, porque un ciclo
   * de módulos rompe o no según POR DÓNDE se entre: este archivo ya evaluaba
   * el enum antes de llegar a `constants`. Un test de runtime no puede fijar
   * eso. Se mide la estructura, que sí es determinista — el mismo criterio que
   * el caso de acá abajo.
   */
  it("constants no importa el enum desde types: cerraria un ciclo", () => {
    const fuente = fs.readFileSync(
      path.join(__dirname, "..", "config", "assemblies.constants.ts"),
      "utf-8"
    );

    expect(
      fuente,
      "`assemblies.constants.ts` volvió a importar de `assemblies.types.ts`. " +
        "Ese ciclo deja las etiquetas bajo la clave `undefined`, y `tsc` no lo ve."
    ).not.toMatch(/from\s+["'][^"']*assemblies\.types["']/);
  });

  /**
   * Y las claves cubren los cuatro estados que manda el back
   * (`App\Modules\Assemblies\Enums\AssemblyStatus`).
   *
   * 🔴 Son NÚMEROS desde el flip del 2026-08-27 (api#439). Las claves se piden
   * al enum en vez de escribirlas: una lista a mano acá volvería a ser la
   * segunda tabla que este archivo entero existe para impedir.
   *
   * ⚠️ `Object.keys` devuelve strings aunque las claves sean numéricas — es
   * cómo funciona un objeto de JS —, así que la comparación se hace sobre los
   * valores del enum pasados por `String()`. Comparar contra los números
   * pelados daría rojo por el tipo y no por lo que se quiere medir.
   */
  it("cubre los cuatro estados del back", () => {
    const esperadas = [
      AssemblyStatus.Scheduled,
      AssemblyStatus.InProgress,
      AssemblyStatus.Completed,
      AssemblyStatus.Cancelled,
    ]
      .map(String)
      .sort();

    expect(Object.keys(STATUS_LABELS).sort()).toEqual(esperadas);
  });
});
