import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

/**
 * El filtro INICIAL de un módulo llega al back y sobrevive al primer clic.
 *
 * ## 🔴 Por qué existe
 *
 * La pantalla de Accesos tiene un filtro de período con nueve opciones que
 * **excluye "Todos" a propósito**, pero la lista arrancaba sin ningún período:
 * justo el estado que el filtro no ofrece. Se pagaba en el export, que hereda
 * el filtro de la pantalla — medido el 2026-08-08, **198.004 accesos y unas
 * 6.600 páginas** de PDF.
 *
 * Al ponerle el período inicial aparecieron DOS trampas, y las dos son
 * silenciosas:
 *
 * 1. `params.filterBy` viaja al back como la cadena `campo:valor|campo:valor`
 *    —es lo que arma `onFilter` con un `join("|")`—. Un objeto se serializa
 *    como `filterBy[in_at]=m`, y el back, que hace `explode('|', $filterBy)`,
 *    no lo entiende: **la lista sale sin filtrar y nada avisa**.
 *
 * 2. `onFilter` construye el nuevo filtro mezclando `oldFilter` con lo que el
 *    usuario tocó. Si `oldFilter` arranca vacío, **el primer clic en cualquier
 *    otro filtro borra el período inicial** sin que nadie lo pida.
 *
 * ⚠️ Es un source-parsing: pinea que el hook TENGA el cableado, no que el
 * browser lo pinte bien. Lo segundo lo dice abrir la pantalla.
 */
describe("useCrud: el filtro inicial de un módulo", () => {
  const fuente = fs.readFileSync(
    path.join(__dirname, "..", "useCrud.tsx"),
    "utf-8",
  );

  it("normaliza el filterBy inicial a la cadena que espera el back", () => {
    expect(
      fuente,
      "Falta `filtroInicialComoCadena`: sin eso un `paramsInitial.filterBy` en " +
        "forma de objeto viaja como `filterBy[campo]=valor` y el back no lo " +
        "entiende — la lista sale SIN filtrar y nada avisa.",
    ).toContain("filtroInicialComoCadena");

    expect(
      fuente,
      "El filtro inicial no se está aplicando a `params`: se declara y no llega.",
    ).toMatch(/filterBy:\s*filtroInicialComoCadena\(paramsInitial\?\.filterBy\)/);
  });

  it("arranca oldFilter con el filtro inicial, no vacío", () => {
    const arranque = fuente.match(
      /const \[oldFilter, setOldFilter\]: any = useState\(([\s\S]*?)\);/,
    );

    expect(arranque, "No encontré la inicialización de `oldFilter`.").not.toBeNull();
    expect(
      arranque![1],
      "`oldFilter` arranca vacío: el primer clic en otro filtro va a borrar el " +
        "período inicial en silencio, porque `onFilter` mezcla contra `oldFilter`.",
    ).toContain("paramsInitial");
  });
});

/**
 * Y la pantalla de Accesos declara su período.
 *
 * ⚠️ Va aparte del hook: el cableado puede estar bien y la pantalla no usarlo,
 * que es exactamente lo que pasaba.
 */
describe("Accesos arranca con un período", () => {
  it("la pestaña de accesos declara filterBy en sus params iniciales", () => {
    const fuente = fs.readFileSync(
      path.join(__dirname, "..", "..", "..", "..", "modulos", "Activities", "Activities.tsx"),
      "utf-8",
    );

    const bloque = fuente.match(
      /const paramsInitialAccess = \{([\s\S]*?)\};/,
    );

    expect(bloque, "No encontré `paramsInitialAccess`.").not.toBeNull();
    expect(
      bloque![1],
      "Accesos volvió a arrancar sin período: el export se lleva las 198.004 " +
        "filas del condominio y salen ~6.600 páginas.",
    ).toContain("filterBy");
  });
});
