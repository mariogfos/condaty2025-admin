import { describe, expect, it } from "vitest";

import {
  DPTO_CON_PLAN_DE_PAGOS,
  DPTO_SIN_PLAN_DE_PAGOS,
  desdeElInterruptor,
  tienePlanDePagos,
} from "../dptoPaymentPlan";

/**
 * El interruptor del plan de pagos de una unidad.
 *
 * 🔴 Todo este archivo existe por UN caso: el `1`. En producción la columna es
 * booleana y `1` significa "sí tiene plan"; acá es un enum numérico desde 1 y
 * `1` significa **sin plan**. El parche de producción (`6396d47a`) trae un
 * `parseBoolean` que acepta `1` como verdadero, y copiarlo deja la regla dada
 * vuelta para las 2.888 unidades que no tienen ningún plan.
 */
describe("el plan de pagos de una unidad", () => {
  it("🔴 el 1 es SIN plan, no con plan", () => {
    expect(tienePlanDePagos(DPTO_SIN_PLAN_DE_PAGOS)).toBe(false);
    expect(tienePlanDePagos(1)).toBe(false);
    expect(tienePlanDePagos("1")).toBe(false);
  });

  it("el 2 es con plan", () => {
    expect(tienePlanDePagos(DPTO_CON_PLAN_DE_PAGOS)).toBe(true);
    expect(tienePlanDePagos(2)).toBe(true);
    expect(tienePlanDePagos("2")).toBe(true);
  });

  it("🔴 un booleano NO alcanza para decir que sí", () => {
    // `true` es la forma vieja. Si se aceptara, un front sin actualizar
    // prendería el plan de pagos de cualquier unidad que mande `true`.
    expect(tienePlanDePagos(true)).toBe(false);
    expect(tienePlanDePagos("Y")).toBe(false);
    expect(tienePlanDePagos("S")).toBe(false);
  });

  it("lo que no vino no es un plan", () => {
    expect(tienePlanDePagos(undefined)).toBe(false);
    expect(tienePlanDePagos(null)).toBe(false);
    expect(tienePlanDePagos("")).toBe(false);
    expect(tienePlanDePagos(0)).toBe(false);
  });

  it("el interruptor manda el número del enum, no un booleano", () => {
    expect(desdeElInterruptor(true)).toBe(DPTO_CON_PLAN_DE_PAGOS);
    expect(desdeElInterruptor(false)).toBe(DPTO_SIN_PLAN_DE_PAGOS);

    // ⚠️ Nunca un booleano: `Boolean(2)` es `true`, y del lado del API eso
    // entra al cast del enum como 1 — otra vez el case equivocado.
    expect(typeof desdeElInterruptor(true)).toBe("number");
  });

  it("lo que sale del interruptor lo entiende la lectura", () => {
    // La ida y la vuelta tienen que cerrar: si no, la pantalla guarda un
    // valor que ella misma no sabe volver a leer.
    expect(tienePlanDePagos(desdeElInterruptor(true))).toBe(true);
    expect(tienePlanDePagos(desdeElInterruptor(false))).toBe(false);
  });
});
