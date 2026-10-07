import { describe, it, expect } from "vitest";
import { ClientConfigSwitch } from "@/types/clientConfigEnums";
import { hasMaintenanceValue, maintenanceAmountFor } from "../utils";

/**
 * 🔴 Mantenimiento de valor: si el condominio no lo habilita, **ni se muestra
 * ni se suma**. Regla de Mario (2026-08-07), para todo lugar donde se toque.
 *
 * ⚠️ La mitad de "no suma" es la que faltaba en las pantallas. Y ya había un
 * caso al revés en "Todas las deudas": la celda del Monto total sumaba
 * mantenimiento y el pie de la tabla no, así que **la suma de la columna no
 * daba el total de abajo**. Las dos puntas hacen ahora la misma pregunta.
 *
 * Su gemelo en PHP es `App\Mk\Export\Support\MantenimientoDeValor`.
 */
const condominio = (habilitado: boolean) => ({
  client_id: "c-1",
  // Desde el 2026-10-07 el API manda el enum, no un booleano.
  clients: [{ id: "c-1", config: { has_maintenance_value: habilitado ? ClientConfigSwitch.ENABLED : ClientConfigSwitch.DISABLED } }],
});

describe("maintenanceAmountFor", () => {
  it("suma el monto cuando el condominio lo tiene habilitado", () => {
    expect(
      maintenanceAmountFor(condominio(true), { maintenance_amount: "125.50" }),
    ).toBe(125.5);
  });

  it("devuelve cero cuando el condominio NO lo tiene habilitado", () => {
    expect(
      maintenanceAmountFor(condominio(false), { maintenance_amount: "125.50" }),
    ).toBe(0);
  });

  it("pregunta lo mismo que decide si la columna se ve", () => {
    expect(hasMaintenanceValue(condominio(false))).toBe(false);
    expect(hasMaintenanceValue(condominio(true))).toBe(true);
  });

  /**
   * 🔴🔴 El `1` es APAGADO desde el 2026-10-07. La función devolvía el valor
   * crudo y las quince pantallas lo usaban como verdad: un condominio con el
   * mantenimiento apagado lo habría visto en todas. Y un `true` viejo tampoco
   * es prendido: el API ya no lo manda.
   */
  it("el 1 y el booleano viejo son apagado; sólo el 2 es prendido", () => {
    const con = (valor: unknown) => ({ client_id: "c-1", clients: [{ id: "c-1", config: { has_maintenance_value: valor } }] });

    expect(hasMaintenanceValue(con(1))).toBe(false);
    expect(hasMaintenanceValue(con(true))).toBe(false);
    expect(hasMaintenanceValue(con(undefined))).toBe(false);
    expect(hasMaintenanceValue(con(2))).toBe(true);
    expect(hasMaintenanceValue(con("2"))).toBe(true);
  });

  it("sin dato aporta cero, no NaN", () => {
    expect(maintenanceAmountFor(condominio(true), {})).toBe(0);
    expect(maintenanceAmountFor(condominio(true), { maintenance_amount: null })).toBe(0);
    expect(maintenanceAmountFor(condominio(true), { maintenance_amount: "" })).toBe(0);
  });

  // ⚠️ Sin sesión no se inventa el permiso: aporta cero.
  it("sin datos del usuario aporta cero", () => {
    expect(maintenanceAmountFor(undefined, { maintenance_amount: "80" })).toBe(0);
    expect(maintenanceAmountFor({}, { maintenance_amount: "80" })).toBe(0);
  });
});
