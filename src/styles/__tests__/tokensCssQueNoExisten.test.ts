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
 * ⚠️ AL CERRAR UNA ASIMETRÍA DE ESTE BARRIDO, PREGUNTATE CUÁL QUEDA ABIERTA: pasó dos
 * veces acá y las dos la mitad que faltaba DABA PERMISO. 🔴 Y «fuera de alcance» no es
 * «no pasa»: esta lista decía «medido» y era falso. Si ponés un número, medilo:
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
 * 🔴 Escáner con estado y no un regex: dentro de un string no hay comentarios.
 *
 * Despintar hace falta porque un comentario da por DECLARADO un token que sólo está
 * en prosa —`--btn-width`, comentado en `theme.css:284`, es hoy el único— y por USADO
 * un `var()` comentado. Pero hacerlo SIN VER LOS STRINGS da permiso: el
 * `accept="image/*"` de `Config/DptoConfig/DptoConfig.tsx` abre un comentario falso en
 * la 741 que cierra en la 1441 —655 líneas, la pantalla de configuración entera— y un
 * token roto ahí adentro deja el guardián en VERDE.
 *
 * 🔴 CDT-125 — LA COMILLA SIMPLE FALLA EN SILENCIO, NO RUIDOSAMENTE. Acá decía que un
 * apóstrofe en prosa JSX «si mordiera fallaría ruidosamente». Se midió y es FALSO, y en
 * la dirección peor: el apóstrofe cierra sobre la comilla que ABRE un string real, el
 * contenido de ese string queda en estado código y una barra-asterisco adentro —el
 * `accept` con comillas simples de un input de imagen es la forma exacta— abre un
 * comentario que corre hasta el próximo cierre o hasta el fin del archivo. Todo ese
 * tramo se BORRA, el `var()` que quede adentro se da por NO USADO y por lo tanto NUNCA
 * se compara contra el catálogo: el guardián sale VERDE con el token roto adentro.
 * Medido end-to-end sobre una copia de HEAD: el mismo token inexistente pone el test en
 * rojo, y con un apóstrofe delante los 5 casos pasan.
 *
 * Por eso la comilla simple y la doble ahora sólo abren string si CIERRAN EN LA MISMA
 * LÍNEA **y** no vienen pegadas a un carácter de identificador (ver `abreString`).
 *
 * 🔴 CDT-127 — CADA REGLA TIENE ABAJO LA FILA QUE LA DISCRIMINA, Y ANTES NO. Acá decía que
 * un caso se ponía rojo «si alguien vuelve a cualquiera de las dos reglas viejas», y era
 * falso: borrando sólo la 1 los dos casos seguían VERDES, porque en los dos el apóstrofe
 * está pegado a una letra y los tapaba la regla 2. La entrada que discrimina la 1 —una
 * comilla de prosa que NO viene pegada a nada, `Los '90`, con el atributo en la línea
 * SIGUIENTE— ahora existe. Medido borrando cada regla por separado: sin la 1 se pone roja
 * ésa; sin la 2, las del apóstrofe pegado.
 *
 * 🔴 LA SEGUNDA CONDICIÓN NO ES DE ADORNO, Y ACÁ HABÍA UN LÍMITE AFIRMADO SIN MEDIR.
 * Esta lista decía que el hueco que quedaba —prosa y atributo en la misma línea— dejaba
 * «el daño acotado a esa línea». Se midió y era FALSO, en la misma dirección de siempre:
 * `<p>d'ía</p><input accept='image/*' />` en UNA sola línea —ni siquiera hacen falta dos
 * apóstrofes— hace que el apóstrofe cierre sobre la comilla que ABRE el atributo, la
 * barra-asterisco quede en estado código y borre desde ahí hasta el próximo cierre o el
 * fin del archivo. La condición nueva lo cierra: el apóstrofe pegado a la `d` ya no abre
 * nada. Caso ejecutable con las dos variantes —una línea y dos— más abajo.
 *
 * 🔴 CDT-127 — Y LA CONDICIÓN ERA CIEGA A LOS ACENTOS, EN UN PRODUCTO CON LA COPIA EN
 * CASTELLANO. Decía `[A-Za-z0-9]`: una comilla pegada a una vocal con tilde, a la eñe, a
 * un guion bajo o a un signo peso NO entraba, volvía a contar como delimitador y reabría
 * el camino entero. Medido end-to-end contra el árbol real, no sobre una muestra: un
 * `.tsx` con `<p>El acta se subió'l lunes</p><input accept='image/*' />` y un `var()` de
 * un token inexistente debajo dejaba los 7 casos VERDES, y el MISMO archivo escrito
 * `subio` sin tilde ponía el guardián en rojo nombrando el token. Un acento decidía si el
 * guardián veía o no un token roto. Ahora la condición es `\p{ID_Continue}` —el conjunto
 * que define un identificador de JS, que es de lo que habla la regla— más el signo peso,
 * y con eso entra también el acento DESCOMPUESTO (NFD), que es lo que escribe macOS al
 * copiar y pegar: ahí el carácter anterior a la comilla no es la letra, es la tilde
 * combinante, y `\p{L}` sola tampoco lo habría cazado. Las dos formas tienen su fila.
 *
 * ⚠️ CDT-127 — LO QUE SIGUE SIN CUBRIR ES PROSA SIN GUARDA EJECUTABLE, dicho con todas las
 * letras: regex que abra con barra-asterisco, `url()` sin comillas, `//` a mitad de línea,
 * y una comilla de prosa que NO venga pegada a un identificador —`<p>Los '90</p>`— con un
 * atributo de comilla simple en la MISMA línea (en líneas distintas sí está cubierto: es
 * la fila que discrimina la regla 1). Ninguno tiene caso, y a propósito no se afirma acá
 * cuánto daño hace cada uno: eso sería el quinto límite escrito sin medir de esta familia
 * de tickets. Cerrarlos no es agregar otra condición encima, es escribir un parser, y
 * mientras tanto la pantalla sigue siendo la última palabra.
 * Ejemplos descritos, no literales: asterisco-barra cerraría este docblock.
 */

/**
 * ¿La comilla de `i` abre un string de verdad? Dos condiciones, las dos necesarias.
 *
 * 1. Cierra antes del fin de línea. No es una heurística: en JS/TS y en CSS un salto de
 *    línea crudo dentro de un string de comilla simple o doble es error de sintaxis, así
 *    que una comilla que no cierra en su línea NUNCA era un string. La barra invertida se
 *    saltea de a dos, con lo que la continuación de línea de CSS sigue contando como
 *    string.
 * 2. No viene pegada a un carácter de identificador. `d'ía`, `don't`: en JS/TS un
 *    delimitador de string pegado a un identificador es error de sintaxis, así que una
 *    comilla en esa posición es prosa —de JSX o de un comentario— y nunca abrió nada. Los
 *    delimitadores de verdad vienen después de `=`, `(`, `,`, `:`, `[` o espacio.
 *
 * 🔴 La 2 no es cosmética y la 1 sola NO alcanza: medido, `<p>d'ía</p><input
 * accept='image/*' />` en UNA línea hace que el apóstrofe cierre sobre la comilla que
 * ABRE el atributo, la barra-asterisco quede en estado código y se coma desde ahí hasta
 * el próximo cierre o el fin del archivo. Un solo apóstrofe, no dos.
 *
 * 🔴 CDT-127 — «identificador» se escribe `\p{ID_Continue}`, NO `[A-Za-z0-9]`. Con el
 * rango ASCII, `subió'`, `añ'o`, `_'` y `$'` NO entraban y el apóstrofe volvía a abrir
 * string: la copia de este producto está en castellano, así que el hueco era la regla, no
 * el borde. `ID_Continue` incluye las tildes COMBINANTES, con lo que también entra el
 * mismo texto en NFD —lo que escribe macOS al copiar y pegar—, donde el carácter anterior
 * a la comilla es la tilde y no la letra. El `$` va aparte: es identificador en JS pero no
 * en Unicode.
 */
const abreString = (texto: string, i: number): boolean => {
  if (/[\p{ID_Continue}$]/u.test(texto[i - 1] ?? "")) return false;
  const comilla = texto[i];
  for (let j = i + 1; j < texto.length; j++) {
    if (texto[j] === "\\") {
      j++;
      continue;
    }
    if (texto[j] === "\n") return false;
    if (texto[j] === comilla) return true;
  }
  return false;
};

const sinComentarios = (texto: string, conTemplate: boolean): string => {
  let salida = "";
  for (let i = 0, abreLinea = true; i < texto.length; ) {
    const c = texto[i];
    const sig = texto[i + 1];
    if (
      (conTemplate && c === "`") ||
      ((c === '"' || c === "'") && abreString(texto, i))
    ) {
      salida += c;
      for (i++; i < texto.length; i++) {
        const escapado = texto[i] === "\\";
        salida += escapado ? texto.slice(i, i + 2) : texto[i];
        if (escapado) i++;
        else if (texto[i] === c) {
          i++;
          break;
        }
      }
      abreLinea = false;
    } else if (c === "/" && sig === "*") {
      const fin = texto.indexOf("*/", i + 2);
      const hasta = fin < 0 ? texto.length : fin + 2;
      salida += texto.slice(i, hasta).replace(/[^\n]/g, " ");
      i = hasta;
    } else if (c === "/" && sig === "/" && abreLinea) {
      const fin = texto.indexOf("\n", i);
      const hasta = fin < 0 ? texto.length : fin;
      salida += " ".repeat(hasta - i);
      i = hasta;
    } else {
      abreLinea = c === "\n" || (abreLinea && (c === " " || c === "\t"));
      salida += c;
      i++;
    }
  }
  return salida;
};

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
    const texto = sinComentarios(readFileSync(ruta, "utf-8"), false);
    for (const m of texto.matchAll(/(--[A-Za-z][\w-]*)\s*:/g)) definidos.add(m[1]);
  }
  for (const ruta of archivosTs()) {
    // El propio guardián nombra tokens en sus tests: no se cuenta a sí mismo.
    if (ruta === __filename) continue;
    const texto = sinComentarios(readFileSync(ruta, "utf-8"), true);
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
    const texto = sinComentarios(readFileSync(ruta, "utf-8"), /\.tsx?$/.test(ruta));
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

  // Con el Set vacío, «ninguna ya está definida» comparaba [] contra []: no podía
  // fallar. Se afirma la política, que sí puede fallar.
  it("la lista de deuda quedó vacía y sigue vacía", () => {
    expect(
      [...FALTAN_DE_VERDAD],
      `Volvieron a meter tokens acá. La lista se vació midiendo el contraste de cada ` +
        `reemplazo sobre su superficie real: arreglá el token en vez de aplazarlo.`,
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
      for (const m of sinComentarios(readFileSync(ruta, "utf-8"), false).matchAll(
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

  it("no toma el `image/*` de DptoConfig como apertura de comentario", () => {
    const ruta = join(RAIZ, "modulos", "Config", "DptoConfig", "DptoConfig.tsx");
    const crudo = readFileSync(ruta, "utf-8");
    // Sin esto el test se vuelve vacío el día que el input desaparezca.
    expect(crudo, `DptoConfig ya no tiene el caso: buscá otro o borrá el test.`)
      .toContain('accept="image/*"');

    // Y sin lo que sigue se vuelve HUECO sin desaparecer. La medición son dos
    // marcadores que tienen que caer DENTRO de la zona que un despintador ciego a
    // strings tapa; si alguien los mueve fuera, el input sigue existiendo, el test
    // sigue verde y ya no mide nada.
    //
    // CDT-125 — antes la zona se acotaba con `indexOf` desde el propio `accept`, y eso
    // probaba la condición NECESARIA (los marcadores están en ese tramo), no la
    // SUFICIENTE (que ese tramo sea el que el despintador ciego borra). Peor: las dos
    // aperturas que este archivo lista como sin cubrir podrían adelantar la zona real y
    // la aritmética ni se enteraba. Ahora se corre el despintador CIEGO de verdad y se
    // afirma sobre su salida: no hay tramo que calcular.
    const MARCADORES = ["coverAvatarAnchor", "profileLogoShell"];
    // Un rename entra por su propia rama: si no, `-1` diagnosticaba un movimiento
    // que nunca pasó y mandaba al próximo a buscar algo que no ocurrió.
    expect(
      MARCADORES.filter((m) => !crudo.includes(m)),
      `Estos marcadores ya no existen en DptoConfig —renombrados o borrados—, así que ` +
        `no se movieron: no los busques en otra parte del archivo. Elegí otros dos que ` +
        `vivan dentro de la zona que tapa el \`/*\` de \`image/*\` y actualizá la lista.`,
    ).toEqual([]);
    const ciego = crudo.replace(/\/\*[\s\S]*?\*\//g, (b) =>
      b.replace(/[^\n]/g, " "),
    );
    expect(
      MARCADORES.filter((m) => ciego.includes(m)),
      `Un despintador ciego a los strings YA NO borra estos marcadores. Dos causas ` +
        `posibles y hay que distinguirlas antes de tocar nada: o el \`accept\` dejó de ` +
        `abrir una zona que los cubra —el caso que este test reproduce dejó de ocurrir ` +
        `acá—, o los marcadores se movieron a un tramo que ningún bloque tapa. Ojo que ` +
        `esta afirmación sola tampoco prueba CUÁL bloque los borraba: sólo que alguno lo ` +
        `hacía. Movelos adentro de la zona que abre el \`/*\` de \`image/*\`, o elegí ` +
        `otros dos que vivan ahí.`,
    ).toEqual([]);

    // CONTENIDO, no cantidad de líneas: el escáner las conserva y contarlas da 0
    const limpio = sinComentarios(crudo, true); // siempre, aun con el bug puesto.
    expect(
      MARCADORES.filter((m) => !limpio.includes(m)),
      `Despintador otra vez ciego a los strings: el \`/*\` de \`image/*\` (741) tapa ` +
        `hasta la 1441 y el guardián pasa a dar VERDE sobre tokens rotos.`,
    ).toEqual([]);
  });

  /**
   * CDT-125 — el hueco del apóstrofe, con guarda ejecutable y no con prosa.
   *
   * Se afirma la CONSECUENCIA que importa —que el `var()` sigue estando después de
   * despintar—, no cómo la logra el escáner.
   *
   * CDT-127 — cada regla de `abreString` tiene su fila, y se verificó borrándolas por
   * separado: sin la 1 (cerrar en la misma línea) se pone roja la de `Los '90`, la única
   * donde el apóstrofe no viene pegado a nada; sin la 2 (no pegada a un identificador) se
   * ponen rojas las del apóstrofe pegado. La familia de abajo es la que el rango ASCII
   * dejaba pasar: tilde, eñe, guion bajo, signo peso y la tilde COMBINANTE del NFD.
   */
  const conApostrofePegadoA = (palabra: string) =>
    [
      `<p>El acta se ${palabra}'l lunes</p><input accept='image/*' type='file' />`,
      'const color = { background: "var(--cTokenDePruebaCdt125)" };',
    ].join("\n");

  it.each([
    [
      "el apóstrofe y el `accept` en LÍNEAS distintas",
      [
        "<p>Subí la foto el d'ía de la alerta</p>",
        "<input accept='image/*' type='file' />",
        'const color = { background: "var(--cTokenDePruebaCdt125)" };',
      ].join("\n"),
    ],
    [
      // 🔴 La variante que el docblock daba por acotada a su línea SIN medirla: no lo
      // está. Un solo apóstrofe pegado a una letra, el atributo en la MISMA línea, y el
      // borrado se escapa hasta el fin del archivo. Reponé cualquiera de las dos reglas
      // viejas y este caso —no el de dos líneas— es el que se pone rojo.
      "el apóstrofe y el `accept` en la MISMA línea",
      [
        "<p>Subí la foto el d'ía</p><input accept='image/*' type='file' />",
        'const color = { background: "var(--cTokenDePruebaCdt125)" };',
      ].join("\n"),
    ],
    [
      // 🔴 CDT-127 — la fila que discrimina la REGLA 1, y que no existía: acá el apóstrofe
      // viene después de un espacio, así que la regla 2 no lo bloquea y lo único que
      // impide que abra un string es que no cierra en su línea. Borrá la 1 y ésta —sola—
      // se pone roja. Con el atributo en la MISMA línea el escáner todavía se lo come:
      // ese hueco está declarado arriba como prosa sin guarda, a propósito.
      "una comilla de prosa NO pegada, con el `accept` en la línea SIGUIENTE",
      [
        "<p>Los '90 fueron otra época</p>",
        "<input accept='image/*' type='file' />",
        'const color = { background: "var(--cTokenDePruebaCdt125)" };',
      ].join("\n"),
    ],
    ["una vocal con TILDE pegada al apóstrofe", conApostrofePegadoA("subió")],
    ["la EÑE pegada al apóstrofe", conApostrofePegadoA("añ")],
    ["un GUION BAJO pegado al apóstrofe", conApostrofePegadoA("dia_")],
    ["un SIGNO PESO pegado al apóstrofe", conApostrofePegadoA("100$")],
    // El mismo texto que la fila de la tilde, pero en NFD: `o` + tilde combinante. Es lo
    // que macOS escribe al copiar y pegar, y se ve IDÉNTICO en el editor.
    ["una tilde COMBINANTE (NFD) pegada al apóstrofe", conApostrofePegadoA("subio\u0301")],
  ])("un apóstrofe en prosa JSX no se traga un `var()` — %s", (_caso, muestra) => {
    expect(
      sinComentarios(muestra, true),
      `El apóstrofe de la prosa cerró sobre la comilla que ABRE el \`accept\`, la ` +
        `barra-asterisco de adentro quedó en estado código y abrió un comentario que ` +
        `se comió el resto —del archivo, no de la línea—. El \`var()\` desaparece, se ` +
        `da por NO USADO y nunca se compara contra el catálogo: el guardián sale VERDE ` +
        `con el token roto adentro.`,
    ).toContain("var(--cTokenDePruebaCdt125)");
  });

  /**
   * CDT-127 — la autoexclusión es lo que sostiene la propiedad, y no tenía guarda.
   *
   * Una lente levantó como CRITICAL que el token de prueba de este archivo envenenara al
   * guardián, y se refutó con evidencia: el barrido se saltea su propio archivo. Pero lo
   * que refuta es ESA línea, no el recorrido — el recorrido sí llega hasta acá. Borrá el
   * `if (ruta === __filename) continue` de `tokensUsados` y el `var()` de los fixtures de
   * arriba se cuenta como un uso real de un token que no existe: el guardián se pone rojo
   * contra sí mismo y el próximo lo lee como un token roto del producto.
   */
  it("el barrido se excluye a sí mismo: su token de prueba no cuenta como uso", () => {
    // Sin esto el caso se vuelve hueco el día que alguien borre las filas de arriba: no
    // habría fixture que excluir y la aserción de abajo pasaría por vacía.
    expect(
      (readFileSync(__filename, "utf-8").match(/var\(--cTokenDePruebaCdt125\)/g) ?? [])
        .length,
      `Este archivo ya no usa el token de prueba en ningún fixture: sin fixture no hay ` +
        `nada que excluir y este caso dejó de medir la autoexclusión. Buscá el fixture ` +
        `nuevo o borrá este test.`,
    ).toBeGreaterThan(0);

    expect(
      tokensUsados().has("--cTokenDePruebaCdt125"),
      `El barrido se está contando A SÍ MISMO: sacaron la autoexclusión por __filename y ` +
        `el token de mentira de los fixtures entró como uso real. El guardián pasa a ` +
        `acusar de roto un token que no existe en el producto, que es su peor falla: ` +
        `manda al próximo a "arreglar" una pantalla que anda.`,
    ).toBe(false);
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
