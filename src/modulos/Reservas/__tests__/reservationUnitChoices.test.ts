import { describe, expect, it } from "vitest";
import {
  buildReservationUnitChoices,
  buildReservationUnitChoicesForUnits,
  getChoiceOwnerId,
} from "../utils/reservationUnitChoices";
import type { ReservationUnit } from "../Type/ReservaType";

const ana = { id: 11, name: "Ana", last_name: "Perez" };
const luis = { id: 22, name: "Luis", last_name: "Gomez" };
const maria = { id: 33, name: "Maria", last_name: "Perez" };
const pablo = { id: 44, name: "Pablo", last_name: "Perez" };
const sofia = { id: 55, name: "Sofia", last_name: "Gomez" };

const familia: ReservationUnit = {
  id: 6892,
  nro: "5",
  description: "Casa",
  titular: ana,
  homeowner: {
    ...ana,
    dependientes: [
      { id: 1, owner_id: 33, titular_id: 11, owner: maria },
      { id: 2, owner_id: 44, titular_id: 11, owner: pablo },
    ],
  },
  tenant: {
    ...luis,
    dependientes: [
      // Maria es dependiente de los dos: aparece una sola vez.
      { id: 3, owner_id: 33, titular_id: 22, owner: maria },
      { id: 4, owner_id: 55, titular_id: 22, owner: sofia },
    ],
  },
};

describe("las personas a nombre de las que se reserva", () => {
  it("ofrece propietario, inquilino y los dependientes de los dos hogares", () => {
    const choices = buildReservationUnitChoices(familia);

    expect(choices.map(getChoiceOwnerId)).toEqual(["11", "22", "33", "44", "55"]);
    expect(choices.map((choice) => choice.roleLabel)).toEqual([
      "Propietario",
      "Inquilino",
      "Dependiente de propietario",
      "Dependiente de propietario",
      "Dependiente de inquilino",
    ]);
  });

  it("el owner_id es el de la persona elegida, no el del titular", () => {
    const sofiaChoice = buildReservationUnitChoices(familia).find(
      (choice) => choice.roleLabel === "Dependiente de inquilino",
    );

    expect(getChoiceOwnerId(sofiaChoice)).toBe("55");
    expect(getChoiceOwnerId(null)).toBe("");
  });

  it("marca al titular en la etiqueta y a nadie mas", () => {
    const names = buildReservationUnitChoices(familia).map((choice) => choice.name);

    expect(names[0]).toBe("Casa 5: Ana Perez · Propietario (titular)");
    expect(names.filter((name) => name.includes("(titular)"))).toHaveLength(1);
  });

  it("no repite a quien es propietario e inquilino a la vez", () => {
    const choices = buildReservationUnitChoices({
      id: 1,
      nro: "9",
      homeowner: ana,
      tenant: ana,
    });

    expect(choices.map(getChoiceOwnerId)).toEqual(["11"]);
  });

  it("una unidad sin personas no da opciones (no hay 'Sin residente')", () => {
    expect(
      buildReservationUnitChoices({ id: 7631, nro: "185", homeowner: null, tenant: null }),
    ).toEqual([]);
  });

  it("una unidad con solo inquilino ofrece al inquilino y su familia", () => {
    const choices = buildReservationUnitChoices({
      id: 2,
      nro: "3",
      titular: luis,
      homeowner: null,
      tenant: { ...luis, dependientes: [{ owner_id: 55, owner: sofia }] },
    });

    expect(choices.map(getChoiceOwnerId)).toEqual(["22", "55"]);
  });

  it("los ids de opcion no chocan entre unidades con la misma persona", () => {
    const choices = buildReservationUnitChoicesForUnits([
      { id: 1, nro: "1", homeowner: ana },
      { id: 2, nro: "2", homeowner: ana },
    ]);

    expect(choices.map((choice) => choice.id)).toEqual(["1:11", "2:11"]);
  });
});
