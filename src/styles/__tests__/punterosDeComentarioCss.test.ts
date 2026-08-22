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
import { readFileSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { join, relative, resolve, dirname, sep } from "node:path";

const RAIZ = join(__dirname, "..", "..");
/**
 * El inventario arranca en la RAÍZ DEL REPO, no en `src`.
 *
 * CDT-125 — con la raíz en `src` un puntero correcto que saliera de ahí —`./x.css`,
 * `../../otro.css`, `scripts/algo.ts`— era IRRESOLUBLE y ponía el test en rojo mandando a
 * corregir una ruta que ya estaba bien. Una guarda que se pone roja sobre algo correcto
 * es peor que no tenerla: entrena al próximo a desactivarla.
 */
const REPO = join(RAIZ, "..");

/**
 * 🔴 CDT-127 — EL INVENTARIO SALE DE GIT, NO DE RECORRER EL DISCO.
 *
 * El recorrido propio saltaba `node_modules` y lo que empieza con punto, y eso hacía que
 * el resultado dependiera de si la máquina ya había compilado. Medido: con un `dist/` que
 * contenga una copia de un `.css`, el puntero `Reel.module.css` —correcto, único en el
 * árbol versionado— resuelve a DOS y el test se pone rojo sobre algo que está bien:
 * «src/modulos/Balance/Balance.module.css → Reel.module.css (dist/assets/Reel.module.css,
 * src/modulos/Reel/Reel.module.css)». Y por la otra punta, un puntero legítimo bajo una
 * carpeta con punto (`.github/…`) no lo encontraba NINGÚN recorrido y resolvía a cero.
 *
 * Git ya sabe qué archivos son del repo: cierra las dos clases sin lista de exclusiones
 * que después hay que ir manteniendo —`dist`, `coverage`, `storybook-static`, la próxima—.
 * Un puntero a algo NO versionado (`node_modules/…`, una salida de compilación) da cero a
 * propósito: en un clon limpio ese archivo no existe, así que es un puntero colgado.
 */
const listarVersionados = (cwd: string): string[] =>
  execFileSync("git", ["ls-files", "-z"], { cwd, encoding: "utf-8" })
    .split("\0")
    .filter(Boolean);

const versionados = listarVersionados(REPO);

/** `git ls-files` lista archivos; un puntero también puede apuntar a una carpeta. */
const reales = [
  ...new Set(
    versionados.flatMap((r) =>
      r.split("/").map((_, i, partes) => partes.slice(0, i + 1).join("/")),
    ),
  ),
];

/**
 * 🔴 CDT-127 — SE BARRE `src`, aunque el inventario contra el que se RESUELVE sea el repo
 * entero. Son dos conjuntos distintos y sólo el segundo tenía motivo para crecer: sacar el
 * recorrido propio ensanchó el barrido sin que ningún comentario lo dijera.
 */
const archivosCss = () =>
  versionados
    .filter((r) => r.startsWith("src/") && /\.(css|scss)$/.test(r))
    .map((r) => join(REPO, r));

/**
 * Qué cuenta como puntero: lo que va entre backticks y tiene forma de ruta del repo.
 *
 * El backtick es lo que separa el puntero de la prosa. Sin él entran las menciones
 * informales —«añadir al Activities.module.css», «similar a Config.module.css»—, que no
 * son punteros a un motivo y meterlas daría rojo por escribir castellano.
 */
const esPuntero = (t: string): boolean =>
  t.startsWith("src/") || /\.(module\.)?(css|scss|tsx?)$/.test(t);

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
 *
 * El árbol entra por parámetro: el barrido lo llama con el inventario real y los casos de
 * abajo con uno fijo (CDT-127, ver el comentario del `it.each`).
 */
const resuelve = (puntero: string, desdeAbs: string, arbol: string[] = reales): string[] => {
  if (/^\.\.?\//.test(puntero)) {
    const abs = resolve(dirname(desdeAbs), puntero);
    const rel = relative(REPO, abs).split(sep).join("/");
    return arbol.filter((r) => r === rel);
  }
  return arbol.filter((r) => r === puntero || r.endsWith(`/${puntero}`));
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
   * 🔴 CDT-127 — LA IRONÍA. Este ticket existe porque una condición sólo-ASCII era ciega a
   * los acentos en un producto en castellano, y el arreglo trajo OTRA condición sólo-ASCII
   * por la puerta de al lado. `git ls-files` a secas CITA las rutas no-ASCII y escapa los
   * bytes en octal: `acción.module.css` sale como la cadena entrecomillada con `\303\263`
   * adentro, un puntero correcto a ese archivo resuelve a CERO y la guarda se pone roja
   * sobre algo que está bien — la clase exacta que este candidato dice cerrar. Hoy las 971
   * rutas versionadas son ASCII puro: está armado y el disparador todavía no existe.
   *
   * 🔴 Lo apaga `-z`, NO `core.quotePath=false`. Medido con git 2.53.0 en un repo
   * desechable: con `-z` la ruta sale limpia con y sin `quotePath`, porque el separador NUL
   * ya hace innecesario el entrecomillado. Por eso `-z` va solo: sumarle `quotePath=false`
   * daría una bandera INERTE que ningún caso puede poner en rojo, con un comentario al lado
   * jurando que es la que protege — la falla que este archivo persigue. `-z` de paso cubre
   * un nombre con salto de línea adentro, que la separación por líneas partía en dos.
   *
   * Se mide contra un repo desechable: el caso mide el PARSEO de la salida de git, que es
   * lo que puede romperse, y no depende de versionar un archivo con tilde en este repo.
   */
  it("el inventario sale de git y sobrevive a un acento en el nombre", () => {
    const repo = mkdtempSync(join(tmpdir(), "cdt127-"));
    const nombre = "acción.module.css";
    writeFileSync(join(repo, nombre), "");
    execFileSync("git", ["init", "-q"], { cwd: repo });
    execFileSync("git", ["add", "."], { cwd: repo });

    expect(
      listarVersionados(repo).map((r) => r.normalize("NFC")),
      `git citó la ruta con acento y escapó sus bytes en octal. Un puntero correcto a ese ` +
        `archivo resuelve a CERO y la guarda se pone roja sobre algo que ya estaba bien: ` +
        `es el mismo defecto sólo-ASCII que este ticket vino a cerrar, entrando por el ` +
        `archivo hermano. Devolvé \`-z\` a la invocación y la separación por NUL.`,
    ).toEqual([nombre]);

    // Y que el inventario derivado de git sea el que dice ser. Se afirma con ESTE archivo
    // —se lista solo— y con su carpeta, que sólo existe como prefijo derivado: la fila no
    // se calibra al inventario del día, así que ningún rename ajeno la pone roja.
    expect(reales).toContain("src/styles/__tests__/punterosDeComentarioCss.test.ts");
    expect(reales).toContain("src/styles/__tests__");
  });

  /**
   * CDT-125 — las formas del puntero, clavadas contra un árbol FIJO.
   *
   * Se afirma la CONSECUENCIA, no la implementación. Las dos primeras filas son las que
   * el review destapó: un puntero relativo correcto se ponía rojo porque el recorrido
   * arrancaba en `src` y nunca podía resolverlo, y un nombre suelto lo daba por bueno sin
   * mirar cuántos homónimos tiene el árbol.
   *
   * 🔴 CDT-127 — EL ÁRBOL ES FIJO Y NO EL DEL REPO. Antes las filas interrogaban el árbol
   * real y acá la CATEGORÍA ES EL NÚMERO: «nombre suelto único» exigía que ese archivo
   * siguiera siendo el único con ese nombre y «AMBIGUO» que siguieran existiendo dos
   * homónimos del otro. Un rename ajeno los ponía rojos diciendo «la resolución cambió»,
   * que es justo lo que no habría pasado — la misma calibración al inventario del día que
   * el comentario de acá decía haber evitado. Que el árbol real esté sano lo mide el
   * barrido de arriba, que para eso recorre el conjunto entero.
   */
  const ARBOL = [
    "package.json",
    "src/modulos/Balance/Balance.module.css",
    "src/mk/components/forms/Button/button.module.css",
    "src/mk/hooks/useAsyncExport",
    "src/modulos/Reel/Reel.module.css",
    "src/mk/components/RenderView/RenderView.module.css",
    "src/modulos/Adm/RenderView.module.css",
  ];
  const DESDE = join(REPO, "src", "modulos", "Balance", "Balance.module.css");
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
    const donde = resuelve(puntero as string, DESDE, ARBOL);
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
