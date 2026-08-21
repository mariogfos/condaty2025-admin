/**
 * CDT-125 — un puntero de comentario que apunta a un archivo que ya no existe.
 *
 * Varios `.module.css` no repiten su motivo: lo escriben UNA vez y desde los demás
 * apuntan al archivo que lo tiene. Los widgets de gráficos son el caso vivo —el texto
 * estaba triplicado verbatim y se dedupó en CDT-120— y hay más punteros repartidos por
 * otros comentarios de CSS.
 *
 * Esos punteros son rutas literales dentro de un comentario: nada los verifica. Un
 * rename los deja colgados y el motivo se pierde EN SILENCIO, que es exactamente la
 * falla que este proyecto persigue: una doc vieja no se lee como incompleta, se lee como
 * cierta, y manda al próximo a proteger el archivo equivocado.
 *
 * Se mide el conjunto entero, no los widgets: cualquier puntero nuevo escrito con la
 * misma forma queda cubierto sin tocar este test. 🔴 Sin números acá a propósito: la
 * versión anterior decía «los tres widgets» y «otros cuatro sueltos», y el inventario ya
 * no era ése. Un número escrito y no vuelto a medir es la misma falla que el test caza.
 *
 * Un puntero tiene que resolver a UNO. No a cero —eso es un puntero colgado— y tampoco a
 * varios: un nombre suelto sin directorio lo satisface cualquier homónimo del árbol, que
 * es la forma vieja exacta que este candidato corrigió en el CSS de `AsyncExportButton`.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve, dirname, sep } from "node:path";

const RAIZ = join(__dirname, "..", "..");
/**
 * El recorrido arranca en la RAÍZ DEL REPO, no en `src`.
 *
 * CDT-125 — con la raíz en `src` un puntero correcto que saliera de ahí —`./x.css`,
 * `../../otro.css`, `scripts/algo.ts`— era IRRESOLUBLE y ponía el test en rojo mandando a
 * corregir una ruta que ya estaba bien. Una guarda que se pone roja sobre algo correcto
 * es peor que no tenerla: entrena al próximo a desactivarla.
 */
const REPO = join(RAIZ, "..");

/** Archivos Y carpetas: un puntero puede apuntar a cualquiera de las dos cosas. */
const inventario = (dir: string = REPO): string[] => {
  const salida: string[] = [];
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    if (entrada.name === "node_modules" || entrada.name.startsWith(".")) continue;
    const ruta = join(dir, entrada.name);
    salida.push(ruta);
    if (entrada.isDirectory()) salida.push(...inventario(ruta));
  }
  return salida;
};

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

/**
 * Qué cuenta como puntero: lo que va entre backticks y tiene forma de ruta del repo.
 *
 * El backtick es lo que separa el puntero de la prosa. Sin él entran las menciones
 * informales —«añadir al Activities.module.css», «similar a Config.module.css»—, que no
 * son punteros a un motivo y meterlas daría rojo por escribir castellano.
 */
const esPuntero = (t: string): boolean =>
  t.startsWith("src/") || /\.(module\.)?(css|scss|tsx?)$/.test(t);

const reales = inventario().map((r) => relative(REPO, r).split(sep).join("/"));

/**
 * A qué resuelve un puntero. Todo se compara contra el MISMO inventario, con
 * comparación de cadenas: `existsSync` en macOS es ciego a las mayúsculas y el puntero
 * roto que destapó este ticket se diferenciaba del archivo real justo en una mayúscula
 * (`Button.module.css` contra `button.module.css`).
 *
 * - relativo (`./`, `../`): se normaliza contra la carpeta del `.css` que lo escribe, que
 *   es lo que un puntero relativo significa. Puede salir de `src`.
 * - con directorio o desde la raíz (`src/x/y`): sufijo de ruta.
 * - nombre suelto (`Reel.module.css`): también sufijo — y por eso hay que CONTAR.
 */
const resuelve = (puntero: string, desdeAbs: string): string[] => {
  if (/^\.\.?\//.test(puntero)) {
    const abs = resolve(dirname(desdeAbs), puntero);
    const rel = relative(REPO, abs).split(sep).join("/");
    return reales.filter((r) => r === rel);
  }
  return reales.filter((r) => r === puntero || r.endsWith(`/${puntero}`));
};

describe("CDT-125 — los punteros de comentario de los .css apuntan a algo que existe", () => {
  it("todo puntero entre backticks resuelve a UN archivo o carpeta del repo", () => {
    const punteros: { puntero: string; desde: string; donde: string[] }[] = [];
    for (const ruta of archivosCss()) {
      const texto = readFileSync(ruta, "utf-8");
      for (const m of texto.matchAll(/`([A-Za-z0-9_@/.-]+)`/g)) {
        if (esPuntero(m[1])) {
          punteros.push({
            puntero: m[1],
            desde: relative(REPO, ruta),
            donde: resuelve(m[1], ruta),
          });
        }
      }
    }

    // Canario: el umbral es CERO a propósito. Antes era `> 4`, calibrado al inventario
    // del día (7 punteros): borrar los tres del caso vivo dejaba 4, ponía el canario en
    // rojo y diagnosticaba «cambió la forma de escribirlos» —que es justo lo que no
    // había pasado—. Un canario que acusa la causa equivocada es ruido con autoridad.
    expect(
      punteros.length,
      `No se encontró NINGÚN puntero con backticks en los .css. O se borraron todos, o ` +
        `cambió la forma de escribirlos y este test dejó de medir: volvé a medirla.`,
    ).toBeGreaterThan(0);

    expect(
      punteros.filter((p) => p.donde.length === 0).map((p) => `${p.desde} → ${p.puntero}`),
      `Estos comentarios apuntan a un archivo que NO existe. El motivo de por qué ese ` +
        `CSS es como es vive del otro lado del puntero: colgado, se pierde en silencio ` +
        `y el próximo lo lee como cierto igual. Corregí la ruta, o traé el motivo de ` +
        `vuelta al archivo que lo necesita.`,
    ).toEqual([]);

    // CDT-125 — la promesa de «por sufijo de ruta, no por nombre suelto» sólo vale si el
    // puntero trae directorio: un nombre suelto lo satisface CUALQUIER homónimo del
    // árbol. Es la forma vieja exacta que este candidato corrigió en el CSS. La guarda
    // exige lo que promete: si el sufijo resuelve a más de un lado, no apunta a nada.
    expect(
      punteros
        .filter((p) => p.donde.length > 1)
        .map((p) => `${p.desde} → ${p.puntero}  (${p.donde.join(", ")})`),
      `Estos punteros son AMBIGUOS: el nombre resuelve a más de un archivo o carpeta del ` +
        `árbol, así que no señalan un motivo, señalan varios candidatos y el próximo ` +
        `abre el que no es. Agregales directorio hasta que el sufijo sea único.`,
    ).toEqual([]);
  });

  /**
   * CDT-125 — las tres formas del puntero, clavadas contra archivos reales.
   *
   * Se afirma la CONSECUENCIA, no la implementación. Las dos primeras filas son las que
   * el review destapó: un puntero relativo correcto se ponía rojo porque el recorrido
   * arrancaba en `src` y nunca podía resolverlo, y un nombre suelto lo daba por bueno sin
   * mirar cuántos homónimos tiene el árbol.
   */
  const DESDE = join(RAIZ, "modulos", "Balance", "Balance.module.css");
  // Se afirma la CATEGORÍA, no el número: «16 homónimos» sería otro umbral calibrado al
  // inventario de hoy, y el día que alguien borre 15 el caso se pondría rojo diciendo
  // que la resolución cambió, que es justo lo que no habría pasado.
  it.each([
    ["relativo dentro de src", "./Balance.module.css", "uno"],
    ["relativo que SALE de src", "../../../package.json", "uno"],
    ["desde la raíz del repo", "src/mk/components/forms/Button/button.module.css", "uno"],
    ["nombre suelto único", "Reel.module.css", "uno"],
    ["carpeta", "src/mk/hooks/useAsyncExport", "uno"],
    ["errata de mayúscula", "src/mk/components/forms/Button/Button.module.css", "ninguno"],
    ["inexistente", "NoExisteEnNingunLado.module.css", "ninguno"],
    ["nombre suelto AMBIGUO", "RenderView.module.css", "varios"],
  ])("resuelve un puntero %s", (_caso, puntero, esperado) => {
    const donde = resuelve(puntero as string, DESDE);
    const categoria = donde.length === 0 ? "ninguno" : donde.length === 1 ? "uno" : "varios";
    expect(
      categoria,
      `\`${puntero}\` resolvió a ${donde.length} lugares (${donde.slice(0, 3).join(", ") || "ninguno"}). ` +
        `«ninguno» sobre un puntero correcto es el peor caso: la guarda se pone roja ` +
        `sobre algo que ya estaba bien y entrena al próximo a desactivarla. «uno» sobre ` +
        `un nombre suelto ambiguo es la forma vieja que este ticket corrigió: cualquier ` +
        `homónimo del árbol la satisface.`,
    ).toBe(esperado);
  });
});
