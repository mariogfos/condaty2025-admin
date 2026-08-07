import { describe, it, expect } from "vitest";
import {
  AMOUNT_TYPE_MAP,
  getAmountTypeText,
  montoACobrarDeLaDeuda,
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

const condominio = (habilitado: boolean) => ({
  client_id: "c-1",
  clients: [{ id: "c-1", config: { has_maintenance_value: habilitado } }],
});

/**
 * 🔴 El total a condonar sigue la MISMA regla que todo lo demás: si el
 * condominio no habilita mantenimiento de valor, no se muestra ni se suma.
 * Lo definió Mario el 2026-08-07.
 *
 * ⚠️ Este número se PERSISTE al condonar —y además es el denominador del
 * porcentaje—, así que la pregunta no es decorativa: define cuánto se condona.
 * Por eso vive en una función con nombre propio y no como tres `Number()`
 * sueltos adentro de un componente, que fue donde estuvo hasta hoy.
 */
describe("montoACobrarDeLaDeuda", () => {
  const deuda = { amount: "100", penalty_amount: "20", maintenance_amount: "5" };

  it("suma el mantenimiento cuando el condominio lo habilita", () => {
    expect(montoACobrarDeLaDeuda(condominio(true), deuda)).toBe(125);
  });

  it("NO lo suma cuando el condominio no lo habilita", () => {
    expect(montoACobrarDeLaDeuda(condominio(false), deuda)).toBe(120);
  });

  it("los campos que faltan valen cero, no NaN", () => {
    expect(montoACobrarDeLaDeuda(condominio(true), { amount: "100" })).toBe(100);
    expect(montoACobrarDeLaDeuda(condominio(true), {})).toBe(0);
    expect(montoACobrarDeLaDeuda(condominio(true), undefined)).toBe(0);
  });
});
