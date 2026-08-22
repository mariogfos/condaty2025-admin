import { describe, expect, it } from "vitest";
import { lasTresTarjetasDelGrupo } from "../lasTresTarjetasDelGrupo";

/**
 * Las tres tarjetas del detalle de una deuda compartida.
 *
 * ## 🔴🔴 Qué se rompía: el conteo salía NEGATIVO
 *
 * ```ts
 * const total   = extraData.totalReceivable || 0;
 * const pending = total - collected - arrears;
 * ```
 *
 * `totalReceivable` **nunca fue el total del grupo**: es el conteo de lo que
 * falta cobrar. Restarle las cobradas y las vencidas da un número sin
 * significado, y con la mayoría del grupo ya pagada da **negativo**.
 *
 * ## La regla que lo ordena
 *
 * 🔴 Mario, 2026-08-22: *«la deuda debe ser la deuda más la mora, y si
 * corresponde el mantenimiento de valor»*. El API ya la aplica, y «Por cobrar»
 * incluye lo vencido: su importe y su conteo cuentan **las mismas deudas**.
 *
 * Así que «En mora» es un SUBCONJUNTO de «Por cobrar», no una tercera columna
 * aparte — igual que en la pantalla principal de Deudas.
 */
describe("las tres tarjetas del grupo", () => {
  // Un grupo de 10: 5 cobradas, 5 por cobrar, y de esas 5 hay 2 vencidas.
  const grupo = {
    collected: "500.00",
    totalCollected: 5,
    receivable: "435.00",
    totalReceivable: 5,
    arrears: "200.00",
    totalArrears: 2,
  };

  /** 🔴 EL CASO QUE SALÍA NEGATIVO: 5 - 5 - 2 = -2. */
  it("el conteo de «por cobrar» no es negativo: son las que faltan cobrar", () => {
    expect(lasTresTarjetasDelGrupo(grupo).porCobrar.count).toBe(5);
  });

  it("«en mora» es un subconjunto de «por cobrar», no una columna aparte", () => {
    const tarjetas = lasTresTarjetasDelGrupo(grupo);

    expect(tarjetas.enMora.count).toBe(2);
    expect(tarjetas.enMora.count).toBeLessThanOrEqual(tarjetas.porCobrar.count);
  });

  it("el denominador de las barras es el grupo entero", () => {
    const tarjetas = lasTresTarjetasDelGrupo(grupo);

    // 5 por cobrar + 5 cobradas. Las vencidas NO se suman aparte.
    expect(tarjetas.porCobrar.total).toBe(10);
    expect(tarjetas.cobradas.total).toBe(10);
    expect(tarjetas.enMora.total).toBe(10);
  });

  /**
   * ⚠️ Cada conteo va con SU importe, y el importe de «por cobrar» es el que
   * ya incluye lo vencido. Sin este caso, un arreglo que emparejara mal los
   * importes con los conteos quedaría verde.
   */
  it("cada tarjeta lleva su propio importe", () => {
    const tarjetas = lasTresTarjetasDelGrupo(grupo);

    expect(tarjetas.cobradas.amount).toBe(500);
    expect(tarjetas.porCobrar.amount).toBe(435);
    expect(tarjetas.enMora.amount).toBe(200);
  });

  /** El sobre puede venir vacío mientras carga: cero, no `NaN`. */
  it("sin datos devuelve ceros, no NaN", () => {
    const tarjetas = lasTresTarjetasDelGrupo(undefined);

    for (const tarjeta of [tarjetas.cobradas, tarjetas.porCobrar, tarjetas.enMora]) {
      expect(tarjeta.amount).toBe(0);
      expect(tarjeta.count).toBe(0);
      expect(tarjeta.total).toBe(0);
    }
  });

  it("un importe que llega como texto se lee igual", () => {
    expect(lasTresTarjetasDelGrupo({ receivable: "1234.56" }).porCobrar.amount).toBe(1234.56);
    expect(lasTresTarjetasDelGrupo({ receivable: "" }).porCobrar.amount).toBe(0);
  });
});
