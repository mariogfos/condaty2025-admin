import { readFileSync } from "fs";
import { join } from "path";

import { describe, expect, it } from "vitest";

import {
  contadoresPorId,
  contadoresPorNombre,
} from "../tarjetasDeContadores";

/**
 * 🔴 Las dos pantallas salteaban una clave CON NOMBRE por POSICIÓN
 * (`if (i !== 0)`), y andaba sólo porque el API deja el total primero:
 * `array_merge(['total_units' => $totalUnits], $units)`. Una dependencia de
 * orden entre dos repos que no se compilan juntos y que nada medía.
 */
describe("contadoresPorNombre: los tipos de unidad", () => {
  const units = {
    total_units: 120,
    Departamento: 80,
    Casa: 40,
  };

  it("saca el total y deja los tipos", () => {
    expect(contadoresPorNombre(units, "total_units")).toEqual([
      { id: "Departamento", name: "Departamento", value: 80 },
      { id: "Casa", name: "Casa", value: 40 },
    ]);
  });

  /**
   * ⚠️ La que importa: con el total en OTRA posición, el `if (i !== 0)`
   * dibujaba una tarjeta «total_units» y se comía «Departamento».
   */
  it("lo saca aunque el API lo mande en otro lugar", () => {
    const desordenado = { Departamento: 80, total_units: 120, Casa: 40 };

    expect(contadoresPorNombre(desordenado, "total_units")).toEqual([
      { id: "Departamento", name: "Departamento", value: 80 },
      { id: "Casa", name: "Casa", value: 40 },
    ]);
  });

  it("sin datos no explota", () => {
    expect(contadoresPorNombre(null, "total_units")).toEqual([]);
    expect(contadoresPorNombre({}, "total_units")).toEqual([]);
    expect(contadoresPorNombre({ total_units: 0 }, "total_units")).toEqual([]);
  });
});

/**
 * 🔴🔴 Y en Personal el contador además PERDÍA GENTE: venía keyeado por el
 * NOMBRE del rol, que el admin escribe y puede repetir. Medido el 2026-09-02:
 * un condominio tiene DOS roles llamados «Director de Seguridad».
 */
describe("contadoresPorId: los roles del personal", () => {
  const roles = [
    { id: 81, name: "Director de Seguridad" },
    { id: 85, name: "Director de Seguridad" },
    { id: 90, name: "Contabilidad" },
  ];

  it("dos roles con el MISMO nombre son dos tarjetas, cada una con lo suyo", () => {
    const users = { total_users: 3, "81": 1, "85": 1, "90": 1 };

    expect(contadoresPorId(users, roles, "total_users")).toEqual([
      { id: "81", name: "Director de Seguridad", value: 1 },
      { id: "85", name: "Director de Seguridad", value: 1 },
      { id: "90", name: "Contabilidad", value: 1 },
    ]);
  });

  it("acepta el id como número o como texto en el catálogo", () => {
    expect(
      contadoresPorId({ "90": 7 }, [{ id: "90", name: "Contabilidad" }], "total_users"),
    ).toEqual([{ id: "90", name: "Contabilidad", value: 7 }]);
  });

  /**
   * ⚠️ Un contador sin rol en el catálogo se descarta. Una tarjeta sin título
   * se dibuja vacía y se lee como un dato roto del condominio, no como un
   * desajuste entre dos respuestas.
   */
  it("un contador sin rol que lo titule no se dibuja", () => {
    const users = { total_users: 2, "81": 1, "999": 1 };

    expect(contadoresPorId(users, roles, "total_users")).toEqual([
      { id: "81", name: "Director de Seguridad", value: 1 },
    ]);
  });

  it("un rol con nombre vacío tampoco", () => {
    expect(
      contadoresPorId({ "7": 3 }, [{ id: 7, name: "" }], "total_users"),
    ).toEqual([]);
  });

  it("sin catálogo no dibuja nada, y no explota", () => {
    expect(contadoresPorId({ "81": 1 }, null, "total_users")).toEqual([]);
    expect(contadoresPorId(null, roles, "total_users")).toEqual([]);
  });

  /** El total nunca es una tarjeta, ni aunque hubiera un rol con ese id. */
  it("el total no se cuela", () => {
    const salida = contadoresPorId(
      { total_users: 99, "90": 1 },
      [...roles, { id: "total_users", name: "Trampa" }],
      "total_users",
    );

    expect(salida.map((t) => t.id)).toEqual(["90"]);
  });
});

/**
 * Un test del helper no mide a sus consumidores: las dos pantallas podrían
 * seguir con su `if (i !== 0)` y este archivo estaría igual de verde. Montarlas
 * arrastra `useCrud`, el router y media docena de widgets, y lo que se rompía
 * era una comparación de índice — así que se mide sobre el texto.
 */
describe("las dos pantallas ya no saltean por posición", () => {
  const PANTALLAS = [
    ["src/modulos/Dptos/Dptos.tsx", "contadoresPorNombre("],
    ["src/modulos/Users/Users.tsx", "contadoresPorId("],
  ] as const;

  /**
   * ⚠️ Sin comentarios: los docblocks que explican el defecto CITAN el
   * `if (i !== 0)`, así que un barrido sobre el archivo crudo se encuentra a sí
   * mismo y da rojo con el arreglo puesto.
   */
  const codigoDe = (archivo: string) =>
    readFileSync(join(process.cwd(), archivo), "utf8")
      .split("\n")
      .filter((linea) => !/^\s*(\*|\/\/|\/\*)/.test(linea))
      .join("\n");

  it.each(PANTALLAS)("%s no compara el índice", (archivo) => {
    expect(codigoDe(archivo)).not.toMatch(/i\s*!==?\s*0/);
  });

  // La otra mitad: pasaría igual si alguien borrara la tarjeta en vez de
  // arreglarla.
  it.each(PANTALLAS)("%s arma sus tarjetas con %s", (archivo, helper) => {
    expect(codigoDe(archivo)).toContain(helper);
  });
});
