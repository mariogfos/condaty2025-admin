import { describe, it, expect } from "vitest";
import {
  AMOUNT_TYPE_MAP,
  getAmountTypeText,
  montoConsolidadoDeLaDeuda,
} from "../constants";

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

/**
 * 🔴 Condonaciones es la EXCEPCIÓN a la regla de mantenimiento de valor.
 *
 * Regla general (Mario, 2026-08-07): si el condominio no habilita mantenimiento
 * de valor, ni se muestra ni se suma. Acá NO: *"el monto de la deuda condonada
 * es consolidado"*. Este número se PERSISTE al condonar, y condonar de menos
 * dejaría un residuo sin cubrir.
 *
 * ⚠️ Por eso vive en una función propia y con nombre propio, en vez de quedar
 * como tres `Number()` sueltos adentro de un componente: la excepción tiene que
 * ser visible, o el próximo barrido de la regla general se la lleva puesta.
 */
describe("montoConsolidadoDeLaDeuda", () => {
  it("suma deuda, mora y mantenimiento de valor", () => {
    expect(
      montoConsolidadoDeLaDeuda({
        amount: "100",
        penalty_amount: "20",
        maintenance_amount: "5",
      }),
    ).toBe(125);
  });

  it("suma el mantenimiento SIEMPRE: no pregunta por la config del condominio", () => {
    // Es la diferencia con `maintenanceAmountFor`, que devolvería 0 acá.
    expect(
      montoConsolidadoDeLaDeuda({ amount: "100", maintenance_amount: "5" }),
    ).toBe(105);
  });

  it("los campos que faltan valen cero, no NaN", () => {
    expect(montoConsolidadoDeLaDeuda({ amount: "100" })).toBe(100);
    expect(montoConsolidadoDeLaDeuda({})).toBe(0);
    expect(montoConsolidadoDeLaDeuda(undefined)).toBe(0);
  });
});
