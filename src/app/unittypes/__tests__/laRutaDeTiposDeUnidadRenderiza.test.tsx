import { describe, expect, it } from "vitest";

import UnitsTypePage from "../page";

/**
 * 🔴 `/unittypes` renderizaba un OBJETO como componente de React.
 *
 * La página importaba `{ UnitsType }` de `@/mk/utils/utils`, que es un objeto
 * literal con los nombres de los tipos de unidad:
 *
 * ```ts
 * export const UnitsType: any = { D: "Departamento", C: "Casa", … };
 * ```
 *
 * El componente de verdad es el default export de
 * `@/modulos/UnitTypes/UnitsTypes` — que es el que importa `app/ev/page.tsx`, y
 * el que `Config.tsx` embebe en la pantalla de configuración.
 *
 * `<UnitsType />` con un objeto tira *«Element type is invalid: expected a
 * string or a class/function but got: object»* y la ruta entera no carga.
 *
 * ⚠️ **Lo dejó pasar el `: any` de la constante.** Sin esa anotación,
 * TypeScript habría rechazado usar un objeto como componente. Un `any` no es
 * sólo una comprobación menos: es la comprobación que hacía falta.
 *
 * 🔴 No lo linkea ningún menú, así que sólo se ve escribiendo la URL —o
 * volviendo por un bookmark—, que es por lo que sobrevivió.
 */
describe("la ruta /unittypes", () => {
  it("exporta un componente, no un objeto", () => {
    expect(typeof UnitsTypePage).toBe("function");

    const elemento = UnitsTypePage();

    expect(
      typeof elemento.type === "function" || typeof elemento.type === "string",
    ).toBe(true);
  });
});
