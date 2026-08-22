import { describe, expect, it } from "vitest";
import { banderaEncendida } from "../constants";
import {
  DebtBlocking,
  DebtForgivable,
  DebtMaintenanceValue,
  DebtPaymentPlan,
} from "@/types/PaymentType";

/**
 * Las cuatro banderas de una deuda se leen con `banderaEncendida`.
 *
 * ## 🔴🔴 Por qué existe
 *
 * El formulario de deudas INDIVIDUALES las leía así:
 *
 * ```ts
 * has_mv: (item && item.has_mv) || false,
 * ```
 *
 * Desde el 2026-08-22 estas columnas son enums desde 1, y **`1` y `2` son los
 * dos truthy**: abrir una deuda para editarla mostraba las cuatro tildadas,
 * fuera cual fuera su valor, y guardarla las encendía de verdad. Incluida
 * `is_blocking`, que con `check_mora` le bloquea al residente el acceso físico
 * al edificio.
 *
 * ⚠️ Y el detalle (`RenderView`) fallaba por la otra punta: preguntaba
 * `=== "Y"`, la forma de DOS mudanzas atrás, así que mostraba "No" en las
 * cuatro, siempre.
 *
 * Es la misma familia que {@link esCondonable}, con las otras tres columnas.
 */
describe("banderaEncendida", () => {
  const casos = [
    ["has_mv", DebtMaintenanceValue.APLICA, DebtMaintenanceValue.NO_APLICA],
    ["is_forgivable", DebtForgivable.CONDONABLE, DebtForgivable.NO_CONDONABLE],
    ["has_pp", DebtPaymentPlan.ADMITE, DebtPaymentPlan.NO_ADMITE],
    ["is_blocking", DebtBlocking.BLOQUEA, DebtBlocking.NO_BLOQUEA],
  ] as const;

  /**
   * 🔴🔴 EL CASO QUE MIDE EL BUG. Con la numeración vieja el `1` era SÍ; con el
   * enum es el caso BAJO. Un `||` lo lee encendido, y ahí empieza todo.
   */
  it.each(casos)(
    "%s: el caso BAJO está apagado, aunque sea truthy",
    (_columna, _alto, bajo) => {
      expect(banderaEncendida(bajo, _alto)).toBe(false);
      expect(banderaEncendida(String(bajo), _alto)).toBe(false);
    }
  );

  it.each(casos)("%s: el caso ALTO está encendido", (_columna, alto) => {
    expect(banderaEncendida(alto, alto)).toBe(true);
    expect(banderaEncendida(String(alto), alto)).toBe(true);
  });

  /**
   * ⚠️ Las formas viejas siguen circulando por caches y snapshots. Una lectura
   * que entiende una sola forma es exactamente lo que produjo este bug.
   */
  it("entiende el booleano y la 'Y' del char original", () => {
    expect(banderaEncendida(true, DebtBlocking.BLOQUEA)).toBe(true);
    expect(banderaEncendida(false, DebtBlocking.BLOQUEA)).toBe(false);
    expect(banderaEncendida("Y", DebtBlocking.BLOQUEA)).toBe(true);
    expect(banderaEncendida("N", DebtBlocking.BLOQUEA)).toBe(false);
  });

  it("lo que no vino no está encendido", () => {
    expect(banderaEncendida(undefined, DebtBlocking.BLOQUEA)).toBe(false);
    expect(banderaEncendida(null, DebtBlocking.BLOQUEA)).toBe(false);
    expect(banderaEncendida("", DebtBlocking.BLOQUEA)).toBe(false);
    expect(banderaEncendida(0, DebtBlocking.BLOQUEA)).toBe(false);
  });
});
