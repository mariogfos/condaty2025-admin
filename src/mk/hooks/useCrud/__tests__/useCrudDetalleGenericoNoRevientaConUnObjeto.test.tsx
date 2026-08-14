/**
 * CDT-39 (causa raíz compartida) — el Detail genérico y los valores objeto.
 *
 * El síntoma se reportó en Egresos, pero el defecto es del hook: el Detail
 * genérico mete `item[key]` CRUDO adentro de `KeyValue` para todo campo que
 * tenga label y no declare `onRender`. Si ese valor es un objeto —una relación
 * que el back manda expandida en `fullType=DET`— React tira "Objects are not
 * valid as a React child" al montar el modal, se desmonta el árbol ENTERO y la
 * pantalla queda en negro.
 *
 * Egresos se arregló declarando su `renderView`, pero eso arregla UN módulo:
 * cualquier otro sin `mod.renderView`, con una relación expandida y un label
 * encima, cae exactamente igual. Por eso la guarda vive en el hook.
 *
 * `asRenderableValue` tiene un solo llamador —el `value` de `KeyValue` dentro
 * del Detail genérico— y se exporta para poder medirlo sin montar el CRUD
 * entero. Lo que se mide acá es el contrato: pasa todo lo que hoy funciona,
 * descarta sólo lo que hoy revienta.
 */
import React from "react";
import { describe, it, expect } from "vitest";
import { asRenderableValue } from "../useCrud";

describe("asRenderableValue — lo que React puede pintar como hijo", () => {
  it("deja pasar primitivos tal cual", () => {
    expect(asRenderableValue("Mario")).toBe("Mario");
    expect(asRenderableValue(0)).toBe(0);
    expect(asRenderableValue(false)).toBe(false);
    expect(asRenderableValue(null)).toBe(null);
    expect(asRenderableValue(undefined)).toBe(undefined);
  });

  it("deja pasar elementos de React", () => {
    const el = <span>hola</span>;
    expect(asRenderableValue(el)).toBe(el);
  });

  it("deja pasar arrays de primitivos, que hoy se pintan concatenados", () => {
    const arr = ["a", "b"];
    expect(asRenderableValue(arr)).toBe(arr);
  });

  /**
   * 🔴 Ésta es la línea del bug: `user` viene como objeto en `fullType=DET` y
   * el campo "Responsable" de Egresos no declara `onRender`.
   */
  it("descarta un objeto pelado: es lo que dejaba la pantalla en negro", () => {
    expect(
      asRenderableValue({ id: "u-1", name: "Mario", last_name: "Guzmán" }),
    ).toBe(null);
  });

  it("descarta un array con objetos adentro, que revienta igual", () => {
    expect(asRenderableValue([{ id: 1 }, { id: 2 }])).toBe(null);
  });
});
