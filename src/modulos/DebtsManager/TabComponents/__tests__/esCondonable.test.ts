import { describe, expect, it } from "vitest";
import { esCondonable } from "../constants";
import { DebtForgivable } from "@/types/PaymentType";

/**
 * `is_forgivable` se lee con `esCondonable`, no comparando contra "Y".
 *
 * ## 🔴 Por qué existe
 *
 * La columna `debt_dptos.is_forgivable` fue `char(1)` con `'Y'`/`'N'` hasta la
 * migración del 2026-06-30, que la pasó a `tinyint(1)` y le puso el cast
 * `'boolean'` al modelo. Desde ese día la API manda `true`/`false`, pero el
 * formulario de condonaciones seguía preguntando `=== "Y"`.
 *
 * ⚠️ Nunca falló, nunca avisó: simplemente daba SIEMPRE falso. El capital de
 * las deudas condonables no entraba en `amountForgiveness`, que es a la vez el
 * techo con el que se valida el monto y la base con la que se convierte
 * porcentaje ⇄ monto. El operador no podía condonar más que la mora, y el
 * porcentaje que veía estaba calculado sobre otro número.
 *
 * Medido el 2026-08-08 contra la base: **689 deudas condonables** de 15.210.
 *
 * 🔴 Es la misma familia que los chars sobre columnas numéricas: el barrido de
 * enums cubrió MOSTRAR, y esto es LEER PARA CALCULAR — una cuarta superficie.
 *
 * ## 🔴🔴 Y volvió a mudarse el 2026-08-22
 *
 * La columna pasó de `tinyint(1)` a {@link DebtForgivable}, un enum desde 1: el
 * **`1` que significaba SÍ ahora significa NO**. El arreglo de la mudanza
 * anterior aceptaba `1` por las formas viejas, así que sin tocarlo habría
 * empezado a decir que sí justo sobre las NO condonables — la misma inversión,
 * con otra ropa, y otra vez sin dar error.
 *
 * Por eso el `1` pelado ya no se acepta: es ambiguo entre las dos numeraciones.
 */
describe("esCondonable", () => {
  it("entiende la forma nueva: booleano", () => {
    expect(esCondonable({ is_forgivable: true })).toBe(true);
    expect(esCondonable({ is_forgivable: false })).toBe(false);
  });

  /**
   * ⚠️ El enum puede llegar como número o como string si algo se saltea el
   * cast del modelo — una query cruda, un snapshot viejo, un cache.
   */
  it("entiende el número del enum, y también como texto", () => {
    expect(esCondonable({ is_forgivable: DebtForgivable.CONDONABLE })).toBe(true);
    expect(esCondonable({ is_forgivable: DebtForgivable.NO_CONDONABLE })).toBe(false);
    expect(esCondonable({ is_forgivable: String(DebtForgivable.CONDONABLE) })).toBe(true);
  });

  /**
   * 🔴🔴 EL CASO QUE MIDE LA TERCERA MUDANZA. Con la numeración vieja el `1`
   * era SÍ; con el enum es `NO_CONDONABLE`. Si esto vuelve a dar `true`, el
   * formulario está contando como condonables justo las que no lo son.
   */
  it("el 1 de la numeración vieja YA NO es condonable", () => {
    expect(esCondonable({ is_forgivable: 1 })).toBe(false);
    expect(esCondonable({ is_forgivable: "1" })).toBe(false);
  });

  it("sigue entendiendo la forma vieja, que todavía circula", () => {
    expect(esCondonable({ is_forgivable: "Y" })).toBe(true);
    expect(esCondonable({ is_forgivable: "N" })).toBe(false);
  });

  /**
   * 🔴 Y NO dice que sí ante cualquier cosa: un `esCondonable` que devolviera
   * `Boolean(x)` pasaría los tests de arriba y **contaría como condonable la
   * cadena "N"**, que es 100% de las deudas viejas no condonables.
   */
  it("no confunde valores que parecen verdaderos", () => {
    expect(esCondonable({ is_forgivable: "N" })).toBe(false);
    expect(esCondonable({ is_forgivable: "0" })).toBe(false);
    expect(esCondonable({ is_forgivable: 0 })).toBe(false);
    expect(esCondonable({ is_forgivable: null })).toBe(false);
    expect(esCondonable({ is_forgivable: undefined })).toBe(false);
    expect(esCondonable({})).toBe(false);
    expect(esCondonable(undefined)).toBe(false);
  });
});
