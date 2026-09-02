import { describe, it, expect } from "vitest";
import {
  etiquetaDeUnidad,
  opcionesDeUnidades,
  ordenarUnidades,
  titularDeLaUnidad,
  type UnidadDelCombo,
} from "../opcionesDeUnidad";

const propietario = {
  id: "prop-1",
  name: "Ana",
  last_name: "Perez",
};

const inquilino = {
  id: "inq-1",
  name: "Juan",
  last_name: "Gomez",
};

describe("la etiqueta nombra a la persona para la que se crea la reserva", () => {
  it("con inquilino distinto, nombra al titular y aclara quien vive ahi", () => {
    const unidad: UnidadDelCombo = {
      id: 1,
      nro: "5",
      holder: "H",
      homeowner: propietario,
      tenant: inquilino,
    };

    // 168 unidades de produccion caen aca: antes decia "Juan Gomez" y la
    // reserva se creaba para Ana Perez.
    expect(etiquetaDeUnidad(unidad)).toBe(
      "Unidad: 5 - Ana Perez (titular) · vive Juan Gomez",
    );
    expect(titularDeLaUnidad(unidad)).toBe(propietario);
  });

  it("sin inquilino cargado, sigue nombrando al titular", () => {
    // 112 unidades de produccion: antes la opcion salia sin ningun nombre.
    expect(
      etiquetaDeUnidad({ id: 2, nro: "7", holder: "H", homeowner: propietario }),
    ).toBe("Unidad: 7 - Ana Perez (titular)");
  });

  it("cuando el propietario ocupa su unidad, no se repite el nombre", () => {
    expect(
      etiquetaDeUnidad({
        id: 3,
        nro: "9",
        holder: "H",
        homeowner: propietario,
        tenant: propietario,
      }),
    ).toBe("Unidad: 9 - Ana Perez (titular)");
  });

  it("cuando el titular es el inquilino, lo nombra a el", () => {
    expect(
      etiquetaDeUnidad({
        id: 4,
        nro: "11",
        holder: "T",
        homeowner: propietario,
        tenant: inquilino,
      }),
    ).toBe("Unidad: 11 - Juan Gomez (titular)");
  });

  it("sin titular resoluble lo dice, en vez de dejar la opcion muda", () => {
    expect(etiquetaDeUnidad({ id: 5, nro: "13", holder: "T" })).toBe(
      "Unidad: 13 - Sin titular",
    );
  });
});

describe("el orden de las unidades", () => {
  it("ordena por numero de verdad, no como texto", () => {
    const unidades: UnidadDelCombo[] = [
      { id: "a", nro: "10" },
      { id: "b", nro: "9" },
      { id: "c", nro: "2" },
    ];

    // Como texto, "10" va antes que "2" y que "9". Ese era el orden en pantalla.
    expect(ordenarUnidades(unidades).map((u) => u.nro)).toEqual(["2", "9", "10"]);
  });

  it("no muta el arreglo que recibe", () => {
    const unidades: UnidadDelCombo[] = [{ id: "a", nro: "10" }, { id: "b", nro: "2" }];
    ordenarUnidades(unidades);
    expect(unidades.map((u) => u.nro)).toEqual(["10", "2"]);
  });
});

describe("las opciones que arma la pantalla", () => {
  // `opcionesDeUnidades` es la funcion que llama el `useMemo` de
  // CreateReserva.tsx: se mide esa, y no una copia parecida.
  const unidades: Array<UnidadDelCombo & { defaulter?: string }> = [
    { id: "u10", nro: "10", holder: "H", homeowner: propietario, tenant: inquilino, defaulter: "A" },
    { id: "u2", nro: "2", holder: "H", homeowner: propietario, defaulter: "X" },
  ];

  it("ordena por numero y nombra al titular", () => {
    expect(opcionesDeUnidades(unidades)).toEqual([
      { id: "u2", name: "Unidad: 2 - Ana Perez (titular)" },
      { id: "u10", name: "Unidad: 10 - Ana Perez (titular) · vive Juan Gomez" },
    ]);
  });

  it("cuando el area bloquea por deuda, deja solo a los que no deben", () => {
    expect(opcionesDeUnidades(unidades, true).map((o) => o.id)).toEqual(["u2"]);
  });
});
