import { describe, expect, it } from "vitest";

import { TypeFixed, loDefineElSistema } from "../typeEnums";

/**
 * 🔴🔴 Esta guarda estaba INERTE, y no por descuido.
 *
 * `UnitsTypes.tsx` escondía el botón de borrar y `RenderForm.tsx`
 * deshabilitaba el nombre con `item.is_fixed === "A"`, contra una columna que
 * guardaba `'X'` (no fijo) e `'Y'` (fijo). `"Y" === "A"` es **false**, siempre.
 *
 * El `"A"` es el "sí" de `is_visible`, `is_editable` e `is_required` —las tres
 * columnas de `type_fields`—, o sea la comparación **correcta de otra
 * columna**, escrita sobre ésta.
 *
 * Los casos afirman las DOS direcciones: que el tipo del sistema se reconozca y
 * que el de la administración **no**. Sin el segundo, un `loDefineElSistema`
 * que devolviera `true` siempre pasaría el primero — y deshabilitar el nombre
 * en TODOS los tipos es un bug tan real como el que venimos a arreglar.
 */
describe("typeEnums — quién define un tipo de unidad", () => {
  it("el tipo del sistema se reconoce, venga como número o como string", () => {
    expect(loDefineElSistema(TypeFixed.YES)).toBe(true);
    expect(loDefineElSistema("2")).toBe(true);
  });

  it("el tipo de la administración NO es del sistema", () => {
    expect(loDefineElSistema(TypeFixed.NO)).toBe(false);
    expect(loDefineElSistema("1")).toBe(false);
  });

  /**
   * ⚠️ `"A"` es el valor viejo de las columnas vecinas. Después del flip no lo
   * manda nadie, y leerlo como "es del sistema" volvería a esconder los botones
   * por el motivo equivocado.
   */
  it("ni la letra vieja ni un valor fuera del enum esconden nada", () => {
    expect(loDefineElSistema("A")).toBe(false);
    expect(loDefineElSistema("Y")).toBe(false);
    expect(loDefineElSistema(0)).toBe(false);
    expect(loDefineElSistema(undefined)).toBe(false);
    expect(loDefineElSistema(null)).toBe(false);
  });
});
