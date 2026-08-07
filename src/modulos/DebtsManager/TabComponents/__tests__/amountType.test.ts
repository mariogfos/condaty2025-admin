import { describe, it, expect } from "vitest";
import { AMOUNT_TYPE_MAP, getAmountTypeText } from "../constants";

/**
 * 🔴 Cómo se reparte una deuda compartida: UNA tabla, no cuatro.
 *
 * Antes del 2026-08-07 había dos en `constants.ts` —ninguna usada— y una
 * adentro de cada pantalla de compartidas. Entre las cuatro, `P` era
 * "Promedio" en una y "Porcentual" en otra, y aparecía una `V` de "Variable".
 *
 * El back sabe repartir TRES: fijo por unidad, promedio y por m². `P` y `V`
 * eran opciones de filtro que no podían traer ni una fila.
 *
 * ⚠️ Su gemela en PHP es `App\Modules\DebtDptos\Export\TipoDeMonto`, y ese lado
 * tiene el mismo test. Mientras `amount_type` siga siendo un `char(1)` esto se
 * sostiene a mano; el trinquete va en el sprint de guard-rails de enums.
 */
describe("AMOUNT_TYPE_MAP", () => {
  it("tiene los tres repartos que el back sabe hacer", () => {
    expect(Object.keys(AMOUNT_TYPE_MAP)).toEqual(["F", "A", "M"]);
  });

  it("no ofrece repartos que el back no conoce", () => {
    expect(AMOUNT_TYPE_MAP.P).toBeUndefined();
    expect(AMOUNT_TYPE_MAP.V).toBeUndefined();
  });

  it("usa las mismas palabras que el reporte", () => {
    expect(getAmountTypeText("F")).toBe("Fijo");
    expect(getAmountTypeText("A")).toBe("Promedio");
    expect(getAmountTypeText("M")).toBe("Por m²");
  });

  it("sin dato muestra el placeholder, no el código crudo", () => {
    expect(getAmountTypeText("")).toBe("-/-");
    expect(getAmountTypeText("P")).toBe("-/-");
  });
});
