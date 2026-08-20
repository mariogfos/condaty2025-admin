/**
 * CDT-84 — un `var(--x)` que apunta a un token inexistente NO da error.
 *
 * CSS no avisa: la declaración entera se descarta y la propiedad se queda con
 * el valor heredado o el del navegador. En pantalla no se ve roto, se ve
 * *distinto* — un peso de fuente que no es el que se quiso, un color que no es
 * el de la marca. Por eso `--bSemiBold` sobrevivió más de un año: el token real
 * es `--bSemibold`, con la `b` minúscula, y nadie lo notó.
 *
 * Este test barre el conjunto ENTERO, no una muestra: junta todos los tokens
 * definidos en cualquier `.css` y todos los usados dentro de un `var()`, y
 * falla si aparece uno usado SIN valor por defecto que no esté definido.
 *
 * ⚠️ Los usos CON valor por defecto —`var(--x, algo)`— no cuentan: ahí el
 * fallback es el valor y no hay nada roto.
 *
 * 🔴 LA LISTA DE ABAJO ES DEUDA CONOCIDA, NO UNA EXCEPCIÓN CÓMODA. Son 42
 * tokens que no son erratas: no existe ninguno parecido con otra combinación de
 * mayúsculas, así que alguien tiene que decidir qué color o qué medida deberían
 * ser. Están en CDT-114. La lista sólo puede ACHICARSE: agregar una entrada
 * nueva es tapar un bug, y el test lo dice en su mensaje de falla.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const RAIZ = join(__dirname, "..", "..");

/** Deuda conocida — CDT-114. Sólo se achica. */
const FALTAN_DE_VERDAD = new Set([
  "--White", "--accent-color", "--accent-dark", "--bNormal", "--bRadiusXs",
  "--blackv1", "--borderRadius", "--cAccentHover", "--cBlackV5", "--cDarkv2",
  "--cEmerald", "--cGray", "--cGrayDark", "--cGrayMd", "--cGrayV2",
  "--cHoverLight", "--cHoverNeutral-300", "--cHoverTable", "--cHovertablepdf",
  "--cLight", "--cLightDark", "--cLightv2", "--cLightv3", "--cPrimaryHover",
  "--cSeparator", "--cText", "--cTextMuted", "--cTextSecondary", "--cWhiteV",
  "--cWhites-Whites-cWhite", "--cWhitheV1", "--dark-color", "--dark-v2",
  "--darkv3", "--entry-dot-color", "--error-dark", "--font-app-sans",
  "--font-geist-mono", "--font-geist-sans", "--font-mono", "--light-color",
  "--light-v1", "--light-v2", "--light-v3", "--neutralColor50",
  "--primary-color", "--primary-dark", "--spX", "--spXL", "--spXXS",
  "--table-finance-min-width", "--white",
]);

/**
 * Recorrido propio en vez de un glob: `globSync` de `node:fs` corre bien pero
 * no está en los tipos de esta versión de `@types/node`, y un `tsc` rojo por
 * una herramienta de test es ruido que después nadie distingue del ruido real.
 */
const archivosCss = (dir: string = RAIZ): string[] => {
  const salida: string[] = [];
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    if (entrada.name === "node_modules" || entrada.name.startsWith(".")) continue;
    const ruta = join(dir, entrada.name);
    if (entrada.isDirectory()) salida.push(...archivosCss(ruta));
    else if (/\.(css|scss)$/.test(entrada.name)) salida.push(ruta);
  }
  return salida;
};

describe("CDT-84 — ningún `var()` apunta a un token que no existe", () => {
  it("todos los tokens usados sin valor por defecto están definidos", () => {
    const definidos = new Set<string>();
    const usados = new Map<string, string[]>();

    for (const ruta of archivosCss()) {
      const texto = readFileSync(ruta, "utf-8");
      for (const m of texto.matchAll(/(--[A-Za-z][\w-]*)\s*:/g)) {
        definidos.add(m[1]);
      }
      // Sólo los usos SIN fallback: `var(--x)` y no `var(--x, algo)`.
      for (const m of texto.matchAll(/var\(\s*(--[A-Za-z][\w-]*)\s*\)/g)) {
        const lista = usados.get(m[1]) ?? [];
        lista.push(relative(RAIZ, ruta));
        usados.set(m[1], lista);
      }
    }

    // Un canario: si el barrido no encontró nada, no está midiendo.
    expect(definidos.size).toBeGreaterThan(100);
    expect(usados.size).toBeGreaterThan(50);

    const rotos = [...usados.keys()]
      .filter((t) => !definidos.has(t))
      .filter((t) => !FALTAN_DE_VERDAD.has(t))
      .sort();

    expect(
      rotos,
      rotos.length
        ? `Estos tokens se usan sin valor por defecto y NO están definidos en ningún .css, ` +
            `así que esas declaraciones se descartan en silencio:\n` +
            rotos
              .map((t) => `  ${t}  →  ${[...new Set(usados.get(t))].join(", ")}`)
              .join("\n") +
            `\n\nSi es una errata de mayúsculas, corregí el uso. Si el token falta ` +
            `de verdad, la decisión de qué valor darle es de producto: va a CDT-114. ` +
            `Agregarlo a FALTAN_DE_VERDAD sin esa decisión es tapar el bug.`
        : undefined,
    ).toEqual([]);
  });

  it("la lista de deuda conocida no tiene entradas que ya se hayan definido", () => {
    const definidos = new Set<string>();
    for (const ruta of archivosCss()) {
      for (const m of readFileSync(ruta, "utf-8").matchAll(
        /(--[A-Za-z][\w-]*)\s*:/g,
      )) {
        definidos.add(m[1]);
      }
    }
    const yaResueltos = [...FALTAN_DE_VERDAD].filter((t) => definidos.has(t));
    expect(
      yaResueltos,
      `Estos ya están definidos: sacalos de FALTAN_DE_VERDAD. Una lista de deuda ` +
        `que no se achica deja de leerse.\n  ${yaResueltos.join(", ")}`,
    ).toEqual([]);
  });
});
