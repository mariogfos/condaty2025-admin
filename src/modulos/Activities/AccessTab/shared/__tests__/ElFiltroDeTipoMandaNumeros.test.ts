import { describe, expect, it } from "vitest";

import { getAccessUnit, getAccessUnitLabel } from "../accessDetailUtils";
import {
  ACCESS_TYPE_FILTER_OPTIONS,
  ACCESS_TYPE_LABEL,
  AccessType,
} from "../accessEnums";

/**
 * El filtro "Tipo de Acceso" del listado del admin manda su `id` al backend.
 *
 * ## 🔴 El bug que este archivo cierra
 *
 * La lista de opciones estaba escrita a mano con las letras viejas
 * (`{ id: "C" }`, `{ id: "I" }`...). Ese id viaja dentro de `filterBy` y
 * termina en un `where('accesses.type', 'C')` contra una columna TINYINT:
 * MariaDB convierte `'C'` a **0** y no matchea nada. Despues del flip del
 * 2026-08-09, TODAS las opciones del filtro devolvian la lista vacia — sin
 * error, sin aviso, y la pantalla se veia perfecta.
 *
 * Es una forma de sobrevivir del char que no estaba en el catalogo: el valor
 * que **viaja al backend** dentro de un array de opciones. No es una
 * comparacion (`=== 'C'`) ni una clave de tabla (`tabla['C']`), asi que ni el
 * compilador ni el grep lo veian.
 */
describe("el filtro de tipo de acceso", () => {
  it("manda numeros, nunca letras", () => {
    for (const opcion of ACCESS_TYPE_FILTER_OPTIONS) {
      expect(typeof opcion.id).toBe("number");
    }
  });

  it("manda exactamente los valores del enum", () => {
    const delFiltro = ACCESS_TYPE_FILTER_OPTIONS.map((o) => o.id).sort();
    const delEnum = Object.values(AccessType)
      .filter((v): v is AccessType => typeof v === "number")
      .sort();

    expect(delFiltro).toEqual(delEnum);
  });

  /**
   * ⚠️ Si alguien agrega un tipo al enum, tiene que aparecer solo en el filtro.
   * Una lista paralela escrita a mano es lo que produjo el bug.
   */
  it("no puede quedarse corto cuando el enum crece", () => {
    expect(ACCESS_TYPE_FILTER_OPTIONS).toHaveLength(
      Object.keys(ACCESS_TYPE_LABEL).length,
    );
  });

  it("usa las mismas etiquetas que el resto de la pantalla", () => {
    for (const opcion of ACCESS_TYPE_FILTER_OPTIONS) {
      expect(opcion.name).toBe(ACCESS_TYPE_LABEL[opcion.id as AccessType]);
    }
  });
});

/**
 * A que unidad fue un acceso.
 *
 * 🔴 `access.dpto` sale de `accesses.dpto_id` y es la unidad EXACTA de ese
 * acceso. `owner.dpto[0]` es sólo la primera del residente. Medido el
 * 2026-08-10: **2.663 accesos** mostraban una unidad distinta de la registrada,
 * y hay 126 residentes con más de una unidad.
 *
 * ⚠️ Se prefiere, no se reemplaza: 166.064 accesos no tienen `dpto_id`.
 */
describe("la unidad de un acceso", () => {
  const residenteConDos = {
    owner: { dpto: [{ nro: "A-101" }, { nro: "B-202" }] },
  };

  it("gana la unidad del acceso sobre la primera del residente", () => {
    const acceso = { ...residenteConDos, dpto: { nro: "B-202" } };

    expect(getAccessUnit(acceso)?.nro).toBe("B-202");
  });

  it("sin dpto cae a la primera del residente, como siempre", () => {
    expect(getAccessUnit(residenteConDos)?.nro).toBe("A-101");
  });

  it("sin residente ni unidad no rompe", () => {
    expect(getAccessUnit({})).toBeFalsy();
    expect(getAccessUnitLabel({})).toBe("-/-");
  });

  it("la etiqueta usa el tipo de la unidad del acceso", () => {
    const acceso = {
      ...residenteConDos,
      dpto: { nro: "B-202", type: { name: "Departamento" } },
    };

    expect(getAccessUnitLabel(acceso)).toBe("Departamento B-202");
  });
});
