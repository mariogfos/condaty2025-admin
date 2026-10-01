import { describe, it, expect } from "vitest";
import { opcionesDeUnidades, ordenarUnidades } from "../opcionesDeUnidad";
import { getChoiceOwnerId } from "@/modulos/Reservas/utils/reservationUnitChoices";
import type { ReservationUnit } from "@/modulos/Reservas/Type/ReservaType";

const propietario = { id: 1, name: "Ana", last_name: "Perez" };
const inquilino = { id: 2, name: "Juan", last_name: "Gomez" };
const hija = { id: 3, name: "Lucia", last_name: "Perez" };

describe("el orden de las unidades", () => {
  it("ordena por numero de verdad, no como texto", () => {
    const unidades = [
      { id: "a", nro: "10" },
      { id: "b", nro: "9" },
      { id: "c", nro: "2" },
    ];

    // Como texto, "10" va antes que "2" y que "9". Ese era el orden en pantalla.
    expect(ordenarUnidades(unidades).map((u) => u.nro)).toEqual(["2", "9", "10"]);
  });

  it("no muta el arreglo que recibe", () => {
    const unidades = [{ id: "a", nro: "10" }, { id: "b", nro: "2" }];
    ordenarUnidades(unidades);
    expect(unidades.map((u) => u.nro)).toEqual(["10", "2"]);
  });
});

describe("las opciones 'Unidad y persona' que arma la pantalla", () => {
  // `opcionesDeUnidades` es la funcion que llama el `useMemo` de
  // CreateReserva.tsx: se mide esa, y no una copia parecida.
  const unidades: ReservationUnit[] = [
    {
      id: "u10",
      nro: "10",
      description: "Unidad",
      titular: propietario,
      homeowner: { ...propietario, dependientes: [{ owner_id: 3, owner: hija }] },
      tenant: inquilino,
      defaulter: "A",
    },
    {
      id: "u2",
      nro: "2",
      description: "Unidad",
      titular: propietario,
      homeowner: propietario,
      defaulter: "X",
    },
    // Sin nadie a quien reservarle: no aparece.
    { id: "u5", nro: "5", description: "Unidad", defaulter: "X" },
  ];

  it("una opcion por unidad y persona, ordenadas por numero de unidad", () => {
    expect(opcionesDeUnidades(unidades).map((o) => o.name)).toEqual([
      "Unidad 2: Ana Perez · Propietario (titular)",
      "Unidad 10: Ana Perez · Propietario (titular)",
      "Unidad 10: Juan Gomez · Inquilino",
      "Unidad 10: Lucia Perez · Dependiente de propietario",
    ]);
  });

  it("el owner_id de cada opcion es el de su persona", () => {
    expect(opcionesDeUnidades(unidades).map(getChoiceOwnerId)).toEqual([
      "1",
      "1",
      "2",
      "3",
    ]);
  });

  it("cuando el area bloquea por deuda, deja solo a los que no deben", () => {
    expect(opcionesDeUnidades(unidades, true).map((o) => o.unit.id)).toEqual(["u2"]);
  });
});
