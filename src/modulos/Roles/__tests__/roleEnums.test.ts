import { describe, expect, it } from "vitest";

import {
  RoleFixed,
  loDefineElSistema,
  tieneGenteAsignada,
} from "../roleEnums";

/**
 * 🔴🔴 Lo que fija este archivo es una guarda que estaba INERTE y que el flip
 * del API volvía INVERTIDA.
 *
 * `Roles.tsx` escondía los botones de editar y borrar con
 * `item.is_fixed == "1"`, contra una columna que guardaba `'X'`/`'Y'`:
 *
 *  - antes del flip, `"Y" == "1"` era **false siempre** — no escondía nada;
 *  - después, `1 == "1"` es **true para los NO fijos** — escondería los botones
 *    justo en los roles que el administrador sí puede tocar.
 *
 * Ninguno de los dos estados da un error. Por eso los casos de abajo afirman
 * las DOS direcciones: que el rol del sistema se reconozca, y que el de la
 * administración NO se reconozca.
 */
describe("roleEnums — quién define un rol", () => {
  it("el rol del sistema se reconoce, venga como número o como string", () => {
    expect(loDefineElSistema(RoleFixed.YES)).toBe(true);
    expect(loDefineElSistema("2")).toBe(true);
  });

  /**
   * 🔴 El contrapeso. Sin este caso, un `loDefineElSistema` que devolviera
   * `true` siempre pasaría el test de arriba — y esconder el botón en TODOS los
   * roles es el bug que el flip introducía.
   */
  it("el rol de la administración NO es del sistema", () => {
    expect(loDefineElSistema(RoleFixed.NO)).toBe(false);
    expect(loDefineElSistema("1")).toBe(false);
  });

  /**
   * ⚠️ Los valores del enum empiezan en 1, así que un `0` heredado no es
   * ninguno de los dos casos. Y `undefined` es lo que llega mientras el listado
   * carga: ninguno de los dos puede leerse como "es del sistema".
   */
  it("un valor que no es del enum no esconde nada", () => {
    expect(loDefineElSistema(0)).toBe(false);
    expect(loDefineElSistema(undefined)).toBe(false);
    expect(loDefineElSistema(null)).toBe(false);
    expect(loDefineElSistema("")).toBe(false);
  });

  /**
   * 🔴 `is_assigned` lo empezó a mandar el API el 2026-08-28. Antes no existía,
   * y `undefined` tiene que seguir leyéndose como "no sé, no escondas": el back
   * ya veta el borrado con su mensaje.
   */
  it("is_assigned distingue el rol con gente del rol vacío", () => {
    expect(tieneGenteAsignada(1)).toBe(true);
    expect(tieneGenteAsignada("1")).toBe(true);
    expect(tieneGenteAsignada(0)).toBe(false);
    expect(tieneGenteAsignada(undefined)).toBe(false);
  });
});
