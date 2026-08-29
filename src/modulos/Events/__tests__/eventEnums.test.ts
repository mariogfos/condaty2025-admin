import { describe, expect, it } from "vitest";

import {
  EventDestiny,
  OPCIONES_DE_DESTINO,
  esDestino,
  etiquetaDeDestino,
} from "../eventEnums";

/**
 * 🔴🔴 Esta pantalla tenía DOS vocabularios a la vez.
 *
 * El `Select` ofrecía `{id: "T" | "D" | "G" | "R"}` y dos cascadas comparaban el
 * destino contra `2`, `3`, `4` y `5`. Ninguna comparación dio verdadera jamás —
 * y con el destino ya numérico **pasaban a darla**, asignando listas que el back
 * nunca manda y reventando la pantalla en el `.map()` siguiente.
 *
 * Las cascadas se sacaron. Estos casos fijan el vocabulario que queda.
 */
describe("eventEnums — a quién va dirigido un evento", () => {
  it("reconoce el número, venga como número o como string", () => {
    expect(esDestino(EventDestiny.TODOS, EventDestiny.TODOS)).toBe(true);
    expect(esDestino("3", EventDestiny.GUARDIAS)).toBe(true);
    expect(etiquetaDeDestino(2)).toBe("Departamentos");
  });

  /**
   * 🔴 La letra vieja ya no la manda nadie. Leerla como un destino válido
   * escondería que algo quedó sin migrar.
   */
  it("la letra vieja ya no es un destino", () => {
    expect(esDestino("T", EventDestiny.TODOS)).toBe(false);
    expect(etiquetaDeDestino("T")).toBe("—");
    expect(etiquetaDeDestino("D")).toBe("—");
  });

  it("lo vacío no es ningún destino", () => {
    expect(etiquetaDeDestino(undefined)).toBe("—");
    expect(etiquetaDeDestino(null)).toBe("—");
    expect(etiquetaDeDestino("")).toBe("—");
    expect(etiquetaDeDestino(0)).toBe("—");
  });

  /**
   * 🔴 Los ids del `Select` son lo que se guarda. Si volvieran a ser letras, el
   * API las traduciría —por la ventana entre deploys— pero este repo estaría
   * escribiendo contra un contrato que ya no es el suyo.
   */
  it("las opciones mandan el número que el API guarda", () => {
    expect(OPCIONES_DE_DESTINO.map((o) => o.id)).toEqual([1, 2, 3, 4]);
    expect(OPCIONES_DE_DESTINO.map((o) => o.name)).toEqual([
      "Todos",
      "Departamentos",
      "Guardias",
      "Residentes",
    ]);
  });
});
