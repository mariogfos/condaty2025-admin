/**
 * Recibir visitas: el enum, y que la pantalla lo pueda ESCRIBIR.
 *
 * ────────────────────────────────────────────────────────────────────────
 * 🔴 CUARTA VEZ: UNA REGLA COMPLETA EN EL API Y NINGUNA PANTALLA QUE LA TOQUE
 * ────────────────────────────────────────────────────────────────────────
 *
 * Medido el 2026-09-02: `can_receive_visits` aparecia CERO veces en todo
 * `condaty-admin`. Ni el enum, ni el campo, ni el interruptor. Y en el API:
 *
 * - `DptoVisitReception` (BLOCKED = 1, ALLOWED = 2)
 * - `DptoWriteRequest:107` con `Rule::enum(DptoVisitReception::class)`
 * - `OwnerOperationalPermissionService`: `ACTION_VISIT_APPROVAL` solo corre
 *   sobre unidades que reciben visitas
 * - `AccessHomeService:606` filtra por ella al armar el inicio del guardia
 * - dos archivos de tests y su documentacion
 *
 * ────────────────────────────────────────────────────────────────────────
 * 🔴🔴 Y EL `1` SIGNIFICA LO CONTRARIO QUE EN PRODUCCION
 * ────────────────────────────────────────────────────────────────────────
 *
 * En produccion la columna es `tinyint(1) NOT NULL DEFAULT 1` y `1` es "SI
 * recibe". Aca `1` es BLOCKED. El parche de produccion trae
 * `parseBoolean(item?.can_receive_visits)`, que lee `1` como `true`: copiarlo
 * deja la regla dada vuelta para TODAS las unidades, sin un solo error.
 *
 * Por eso el primer caso de este archivo es justamente ese.
 */
import { describe, it, expect } from "vitest";
import {
  DPTO_NO_RECIBE_VISITAS,
  DPTO_RECIBE_VISITAS,
  desdeElInterruptorDeVisitas,
  recibeVisitas,
} from "../dptoVisitReception";

describe("el enum de recepcion de visitas", () => {
  it("el 1 es NO recibe, al reves que el booleano de produccion", () => {
    expect(DPTO_NO_RECIBE_VISITAS).toBe(1);
    expect(DPTO_RECIBE_VISITAS).toBe(2);
    // El `parseBoolean` del parche leeria esto como "si recibe".
    expect(recibeVisitas(1)).toBe(false);
    expect(recibeVisitas(2)).toBe(true);
  });

  it("acepta el numero en texto: el sobre viaja por una cadena de any", () => {
    expect(recibeVisitas("2")).toBe(true);
    expect(recibeVisitas("1")).toBe(false);
  });

  it("no toma un booleano como si", () => {
    // Un booleano aca es un dato de la epoca anterior.
    expect(recibeVisitas(true)).toBe(false);
    expect(recibeVisitas(false)).toBe(false);
  });

  it("ausente cuenta como que SI recibe", () => {
    // La columna es NOT NULL DEFAULT ALLOWED: una unidad sin el dato es una que
    // el API todavia no mando, no una bloqueada. Bloquear por omision cerraria
    // la puerta a unidades que hoy la tienen abierta.
    expect(recibeVisitas(undefined)).toBe(true);
    expect(recibeVisitas(null)).toBe(true);
  });

  it("el interruptor manda numeros, nunca booleanos", () => {
    expect(desdeElInterruptorDeVisitas(true)).toBe(DPTO_RECIBE_VISITAS);
    expect(desdeElInterruptorDeVisitas(false)).toBe(DPTO_NO_RECIBE_VISITAS);
    expect(typeof desdeElInterruptorDeVisitas(true)).toBe("number");
  });

  it("la ida y la vuelta cierran", () => {
    for (const prendido of [true, false]) {
      expect(recibeVisitas(desdeElInterruptorDeVisitas(prendido))).toBe(prendido);
    }
  });
});
