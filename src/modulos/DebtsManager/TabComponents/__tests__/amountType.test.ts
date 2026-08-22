import { describe, it, expect } from "vitest";
import {
  AMOUNT_TYPE_MAP,
  getAmountTypeText,
  montoACobrarDeLaDeuda,
} from "../constants";
import { AmountType } from "@/types/PaymentType";

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
 * tiene el mismo test. 🟢 Desde el 2026-08-22 las dos salen del enum
 * {@link AmountType}, que está en el SSoT: el trinquete ahora es el test de
 * drift y no la disciplina.
 */
describe("AMOUNT_TYPE_MAP", () => {
  it("tiene los tres repartos que el back sabe hacer", () => {
    expect(Object.keys(AMOUNT_TYPE_MAP).map(Number)).toEqual([
      AmountType.FIJO,
      AmountType.PROMEDIO,
      AmountType.POR_M2,
    ]);
  });

  it("usa las mismas palabras que el reporte", () => {
    expect(getAmountTypeText(AmountType.FIJO)).toBe("Fijo");
    expect(getAmountTypeText(AmountType.PROMEDIO)).toBe("Promedio");
    expect(getAmountTypeText(AmountType.POR_M2)).toBe("Por m²");
  });

  /**
   * 🔴 NULL es legítimo: significa «no aplica» en las deudas que no son
   * expensa ni compartida. Y la letra vieja tiene que caer en el placeholder,
   * no en una etiqueta inventada — un front sin actualizar mandaría `'F'`.
   */
  it("sin dato, con la letra vieja o con un número que no es case: placeholder", () => {
    expect(getAmountTypeText(null)).toBe("-/-");
    expect(getAmountTypeText(undefined)).toBe("-/-");
    expect(getAmountTypeText("F" as unknown as number)).toBe("-/-");
    expect(getAmountTypeText(99)).toBe("-/-");
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
