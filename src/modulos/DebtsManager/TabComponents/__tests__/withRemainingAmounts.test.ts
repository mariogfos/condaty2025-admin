import { describe, expect, it } from "vitest";
import { montoACobrarDeLaDeuda, withRemainingAmounts } from "../constants";

/**
 * El selector de condonaciones muestra y suma lo que TODAVÍA se debe.
 *
 * El caso es el de producción (condonación 28769, 2026-09-02): una expensa de
 * 737,26 con el capital pagado y 17,40 de mora. Sumando lo cargado, el total
 * daba 754,66 y la deuda nueva volvía a cobrar el capital.
 */
const sinMantenimiento = { client_id: "c", clients: [{ id: "c", config: { has_maintenance_value: false } }] };

describe("withRemainingAmounts", () => {
  it("usa lo que queda de cada parte cuando el API lo manda", () => {
    const deuda = withRemainingAmounts({
      id: 1,
      amount: "737.26",
      penalty_amount: "17.40",
      maintenance_amount: "0.00",
      principal_remaining_amount: 0,
      penalty_remaining_amount: 17.4,
      maintenance_remaining_amount: 0,
    });

    expect(montoACobrarDeLaDeuda(sinMantenimiento, deuda)).toBeCloseTo(17.4, 2);
    expect(deuda.id).toBe(1);
  });

  it("sin las claves nuevas (un API viejo) deja la deuda como vino", () => {
    const deuda = withRemainingAmounts({ amount: "500", penalty_amount: "50", maintenance_amount: "0" });

    expect(montoACobrarDeLaDeuda(sinMantenimiento, deuda)).toBe(550);
  });
});
