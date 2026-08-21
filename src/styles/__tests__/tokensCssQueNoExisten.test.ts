/**
 * CDT-84 — un `var(--x)` que apunta a un token inexistente NO da error.
 *
 * CSS no avisa. La declaración se vuelve IACVT (*invalid at computed-value
 * time*) y equivale a `unset`, que NO es lo mismo en toda propiedad:
 *
 *   - propiedad que HEREDA (`color`, `font-*`): queda el valor del padre, así
 *     que en pantalla se ve *distinto*, no roto. Por eso `--bSemiBold` sobrevivió
 *     más de un año: el token real es `--bSemibold`, con la `b` minúscula.
 *   - propiedad que NO hereda (`background-color`, `border-color`): cae a
 *     `initial`, o sea **`transparent`**. Un botón sólido se vuelve invisible.
 *
 * 🔴 Esa diferencia importa al escribir el motivo de un arreglo: en CDT-114 se
 * documentó «el hover no cambiaba nada» sobre tres `background-color` rotos, y
 * lo que de verdad pasaba era que el botón se volvía transparente.
 *
 * Este test barre el conjunto ENTERO, no una muestra, y falla si un token usado
 * SIN valor por defecto no está definido en ninguna parte.
 *
 * ⚠️ Los usos CON valor por defecto —`var(--x, algo)`— no cuentan: ahí el
 * fallback es el valor y no hay nada roto.
 *
 * 🔴 CSS Y TSX SON LA MISMA SUPERFICIE, EN LOS DOS SENTIDOS (CDT-114). Este
 * barrido lee `.ts`/`.tsx` además de `.css` para declaraciones **y** para usos,
 * porque cada mitad tapaba bugs distintos:
 *
 *   Declaraciones que sólo existen en TSX — si no se leen, el guardián acusa de
 *   inexistente a un token que FUNCIONA, que es su peor falla posible: manda al
 *   próximo a "arreglar" algo que anda.
 *     - `src/app/layout.tsx` — `next/font` recibe `variable: "--font-app-sans"`
 *       y la declara en `<html className={appSans.variable}>`.
 *     - `src/modulos/Calendar/CalendarPage.tsx` — `["--entry-dot-color"]` sale del
 *       `style` inline de cada punto, con el color de la entrada: es un valor por
 *       fila y no puede vivir en un `.css`.
 *     - `src/modulos/Balance/TableFinance/TableFinance.tsx` —
 *       `"--table-finance-min-width"` se calcula con el ancho real de la tabla.
 *
 *   Usos que sólo existen en TSX — si no se leen, el guardián da VERDE sobre
 *   tokens rotos. Mientras miró sólo `.css` dejó vivos 7 en 14 usos, entre ellos
 *   `--cWhitheV1` (`SurveyOpenTextChoice.tsx`), que es exactamente la errata de
 *   mayúsculas que este test existe para cazar, y `--cText`, que se corrigió en
 *   `AssemblyConfigForm.module.css` y sobrevivió en `AssemblyDetail.tsx`.
 *
 * ⚠️ Esto mide DECLARACIÓN, no ALCANCE. Un token declarado dentro de un
 * `.module.css` sólo existe bajo esa clase: `--bpt-text-primary` está definido en
 * `.container` de `BankProviderTester`, y usarlo desde otro módulo pasaría este
 * test y seguiría sin pintar. El guardián acota, no reemplaza mirar la pantalla.
 *
 * ⚠️ Lo que sigue fuera de alcance, a propósito (0 instancias vivas hoy, medido):
 *   - CSS dentro de un template literal que se inyecta —`<style>{`:root{--x:…}`}</style>`,
 *     `setAttribute("style", …)`, `cssText`—. Las declaraciones por backtick sí se
 *     leen; armar el nombre del token concatenando (`--c${nombre}`) no.
 *   - Comentarios de línea `//` en medio de una línea de TS. Se descartan sólo los
 *     que abren la línea, para no comerse el `//` de una URL.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const RAIZ = join(__dirname, "..", "..");

/**
 * Deuda conocida — CDT-114. Sólo se achica.
 *
 * Quedó VACÍA: las erratas se corrigieron contra el token real y los que no
 * tenían equivalente se decidieron por valor —midiendo contraste sobre el fondo
 * real, no por parecido de nombre— con el motivo escrito al lado en el CSS.
 */
const FALTAN_DE_VERDAD = new Set<string>([]);

/**
 * Recorrido propio en vez de un glob: `globSync` de `node:fs` corre bien pero no
 * está en los tipos de esta versión de `@types/node`, y un `tsc` rojo por una
 * herramienta de test es ruido que después nadie distingue del ruido real.
 */
const archivos = (re: RegExp, dir: string = RAIZ): string[] => {
  const salida: string[] = [];
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    if (entrada.name === "node_modules" || entrada.name.startsWith(".")) continue;
    const ruta = join(dir, entrada.name);
    if (entrada.isDirectory()) salida.push(...archivos(re, ruta));
    else if (re.test(entrada.name)) salida.push(ruta);
  }
  return salida;
};

const archivosCss = () => archivos(/\.(css|scss)$/);
const archivosTs = () => archivos(/\.tsx?$/);

/**
 * 🔴 El texto se lee SIN comentarios, en los dos barridos.
 *
 * Un regex ciego a comentarios miente en las dos direcciones: da por DECLARADO
 * un token que sólo aparece en prosa —pasó con `--accentColor`, nombrado en un
 * comentario de CDT-114— y da por USADO un `var()` de código muerto comentado.
 * Ninguna de las dos cosas llega al navegador.
 */
const sinComentarios = (texto: string): string =>
  texto.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^[ \t]*\/\/.*$/gm, " ");

/** Las formas en que TS/TSX declara una custom property. */
const DECLARA_DESDE_TS: RegExp[] = [
  // `next/font`: Inter({ variable: "--font-app-sans" }) + <html className={f.variable}>
  /variable:\s*["'`](--[A-Za-z][\w-]*)["'`]/g,
  // clave de objeto de estilo: { "--x": v }, { ["--x" as string]: v }, { [`--x`]: v }
  /["'`](--[A-Za-z][\w-]*)["'`]\s*(?:as\s+\w+\s*)?\]?\s*:/g,
  // imperativo: el.style.setProperty("--x", v)
  /setProperty\(\s*["'`](--[A-Za-z][\w-]*)["'`]/g,
];

/** Todos los tokens definidos, vengan de un `.css` o de un `.ts`/`.tsx`. */
const tokensDefinidos = (): Set<string> => {
  const definidos = new Set<string>();
  for (const ruta of archivosCss()) {
    const texto = sinComentarios(readFileSync(ruta, "utf-8"));
    for (const m of texto.matchAll(/(--[A-Za-z][\w-]*)\s*:/g)) definidos.add(m[1]);
  }
  for (const ruta of archivosTs()) {
    // El propio guardián nombra tokens en sus tests: no se cuenta a sí mismo.
    if (ruta === __filename) continue;
    const texto = sinComentarios(readFileSync(ruta, "utf-8"));
    for (const re of DECLARA_DESDE_TS) {
      for (const m of texto.matchAll(re)) definidos.add(m[1]);
    }
  }
  return definidos;
};

/**
 * Todos los usos SIN fallback: `var(--x)` y no `var(--x, algo)`.
 * Misma amplitud que las declaraciones — `.css` Y `.ts`/`.tsx`.
 */
const tokensUsados = (): Map<string, string[]> => {
  const usados = new Map<string, string[]>();
  for (const ruta of [...archivosCss(), ...archivosTs()]) {
    if (ruta === __filename) continue;
    const texto = sinComentarios(readFileSync(ruta, "utf-8"));
    for (const m of texto.matchAll(/var\(\s*(--[A-Za-z][\w-]*)\s*\)/g)) {
      const lista = usados.get(m[1]) ?? [];
      lista.push(relative(RAIZ, ruta));
      usados.set(m[1], lista);
    }
  }
  return usados;
};

describe("CDT-84 — ningún `var()` apunta a un token que no existe", () => {
  it("todos los tokens usados sin valor por defecto están definidos", () => {
    const definidos = tokensDefinidos();
    const usados = tokensUsados();

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
        ? `Estos tokens se usan sin valor por defecto y NO están definidos ni en un .css ` +
            `ni desde TS/TSX, así que esas declaraciones se descartan en silencio ` +
            `(las que heredan quedan con el valor del padre; las que no, en transparent):\n` +
            rotos
              .map((t) => `  ${t}  →  ${[...new Set(usados.get(t))].join(", ")}`)
              .join("\n") +
            `\n\nSi es una errata de mayúsculas, corregí el uso. Si el token falta de ` +
            `verdad, elegí el reemplazo midiendo CONTRASTE sobre el fondo real —no por ` +
            `parecido de nombre— y dejá escrito de dónde salió. Agregarlo a ` +
            `FALTAN_DE_VERDAD sin esa decisión es tapar el bug.`
        : undefined,
    ).toEqual([]);
  });

  it("la lista de deuda conocida no tiene entradas que ya se hayan definido", () => {
    const definidos = tokensDefinidos();
    const yaResueltos = [...FALTAN_DE_VERDAD].filter((t) => definidos.has(t));
    expect(
      yaResueltos,
      `Estos ya están definidos: sacalos de FALTAN_DE_VERDAD. Una lista de deuda ` +
        `que no se achica deja de leerse.\n  ${yaResueltos.join(", ")}`,
    ).toEqual([]);
  });

  /**
   * CDT-114 — las dos mitades del barrido, clavadas contra casos medidos.
   *
   * Se afirma el caso, no la implementación: si alguien vuelve a angostar
   * cualquiera de los dos lados a `.css`, uno de estos dos se pone rojo.
   */
  it("ve los tokens que declara TS/TSX y no los acusa de inexistentes", () => {
    const definidos = tokensDefinidos();
    const soloCss = new Set<string>();
    for (const ruta of archivosCss()) {
      for (const m of sinComentarios(readFileSync(ruta, "utf-8")).matchAll(
        /(--[A-Za-z][\w-]*)\s*:/g,
      )) {
        soloCss.add(m[1]);
      }
    }
    for (const token of [
      "--font-app-sans", // next/font, src/app/layout.tsx
      "--entry-dot-color", // style inline, src/modulos/Calendar/CalendarPage.tsx
      "--table-finance-min-width", // ancho calculado, TableFinance.tsx
    ]) {
      expect(
        soloCss.has(token),
        `${token} pasó a estar definido en un .css: este caso ya no prueba nada, ` +
          `buscá otro token declarado desde TS/TSX o borrá esta línea.`,
      ).toBe(false);
      expect(
        definidos.has(token),
        `${token} FUNCIONA —lo declara un .tsx— y el guardián lo da por ` +
          `inexistente. Así se manda al próximo a romper una pantalla que anda.`,
      ).toBe(true);
    }
  });

  it("cuenta también los `var()` que viven en TS/TSX", () => {
    const usados = tokensUsados();
    const enTs = [...usados.entries()].filter(([, d]) =>
      d.some((r) => /\.tsx?$/.test(r)),
    );
    expect(
      enTs.length,
      `El barrido de USOS no está mirando TS/TSX. Mientras miró sólo .css dejó ` +
        `vivos 7 tokens rotos en 14 usos —entre ellos --cWhitheV1, la errata de ` +
        `mayúsculas que este test existe para cazar— y encima daba VERDE.`,
    ).toBeGreaterThan(20);
  });
});
