import { describe, expect, it } from "vitest";
import {
  buildReservationUnitChoices,
  buildReservationUnitSelectOptions,
  getReservationUnitOwnerId,
} from "../utils/reservationUnits";
import type { ReservationUnit } from "../types";

describe("reservationUnits", () => {
  it("ordena naturalmente las unidades por numero", () => {
    const units = [
      { id: 10, nro: "10" },
      { id: 2, nro: "2" },
      { id: 1, nro: "1" },
    ] as ReservationUnit[];

    expect(buildReservationUnitSelectOptions(units).map((option) => option.id)).toEqual([
      "1",
      "2",
      "10",
    ]);
  });

  it("mantiene unidades aunque no tengan residente asignado", () => {
    const units = [
      { id: 2, nro: "2", tenant: null },
      {
        id: 1,
        nro: "1",
        type: { name: "Casa" },
        homeowner: { id: 7, name: "Ana", last_name: "Lopez" },
      },
    ] as ReservationUnit[];

    expect(buildReservationUnitSelectOptions(units)).toEqual([
      {
        id: "1",
        name: "Casa 1 - Ana Lopez · Propietario",
      },
      {
        id: "2",
        name: "Unidad 2 - Sin residente",
      },
    ]);
  });

  it("rotula como propietario/residente cuando es la misma persona", () => {
    const units = [
      {
        id: 3,
        nro: "3",
        type: { name: "Departamento" },
        homeowner: { id: 8, name: "Luis", last_name: "Rojas" },
        tenant: { id: 8, name: "Luis", last_name: "Rojas" },
      },
    ] as ReservationUnit[];

    expect(buildReservationUnitChoices(units)).toMatchObject([
      {
        roleLabel: "Propietario/Residente",
        name: "Departamento 3 - Luis Rojas · Propietario/Residente",
      },
    ]);
  });

  it("resuelve el owner_id desde el titular anidado cuando existe", () => {
    const unit = {
      id: 4,
      nro: "4",
      titular: {
        id: 99,
        owner_id: "15",
        owner: { id: 15, name: "Marta", last_name: "Paz" },
      },
    } as unknown as ReservationUnit;

    expect(getReservationUnitOwnerId(unit)).toBe("15");
  });
});
