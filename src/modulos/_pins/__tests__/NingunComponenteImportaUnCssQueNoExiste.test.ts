import { existsSync } from "node:fs";
import { readFileSync } from "node:fs";
import { readdirSync } from "node:fs";
import { join, normalize, resolve } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Ningun componente puede importar un `.module.css` que no existe.
 *
 * ## 🔴 Por que esto no lo caza el build
 *
 * Next compila **lo que alguien importa**. Un componente que nadie monta no se
 * compila nunca, asi que puede tener un import roto durante meses y el build
 * sigue verde. Los cuatro que habia el 2026-08-10 estaban justo asi:
 *
 * | componente | css que pedia | por que fallaba |
 * |---|---|---|
 * | `WidgetRequest` | `RequestWidget.module.css` | el archivo se llama `WidgetRequest.module.css` — el nombre esta dado vuelta |
 * | `HistoryAccess` | `HistoryAccess.module.css` | no existe |
 * | `HistoryPayments` | `HistoryPayments.module.css` | no existe |
 * | `OwnersManager/RenderForm` | `Renderform.module.css` | no existe (el directorio tiene `OwnerManager.module.css`) |
 *
 * Los cuatro eran codigo muerto y se borraron. Este pin existe para que el dia
 * que alguien monte un componente asi, se entere ANTES de romper el build — y
 * no despues, buscando por que la pagina no carga.
 *
 * ⚠️ Un import roto en un componente muerto es una bomba con temporizador: no
 * explota hasta que alguien lo importa, y para entonces el que lo importa cree
 * que rompio el.
 */
const RAIZ = resolve(__dirname, "../../..");

const archivosDeCodigo = (dir: string): string[] => {
  const salida: string[] = [];

  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    if (entrada.name === "node_modules" || entrada.name.startsWith(".")) {
      continue;
    }

    const ruta = join(dir, entrada.name);

    if (entrada.isDirectory()) {
      salida.push(...archivosDeCodigo(ruta));
      continue;
    }

    if (/\.tsx?$/.test(entrada.name)) {
      salida.push(ruta);
    }
  }

  return salida;
};

/** Una sola definición: si el regex cambia, cambia también lo que se cuenta. */
const REGEX_IMPORT_CSS =
  /^\s*import\s+\w+\s+from\s+["'](\.[^"']+\.module\.css)["']/gm;

const contarImportesDeCss = (archivos: string[]): number =>
  archivos.reduce(
    (total, archivo) =>
      total + [...readFileSync(archivo, "utf8").matchAll(REGEX_IMPORT_CSS)].length,
    0,
  );

describe("los imports de css modules", () => {
  /**
   * 🔴 El test de abajo afirma "no hay imports rotos". Si el recorrido o el
   * regex se rompen, la lista sale vacía POR ESO y el test queda verde para
   * siempre, anunciando una cobertura que no existe. Este de acá mide que el
   * barrido efectivamente esté mirando algo. (CDT-46, corte 4.)
   */
  it("el barrido lee el código y encuentra imports de css que revisar", () => {
    const archivos = archivosDeCodigo(RAIZ);
    expect(archivos.length).toBeGreaterThan(100);
    expect(contarImportesDeCss(archivos)).toBeGreaterThan(50);
  });

  it("apuntan todos a un archivo que existe", () => {
    const rotos: string[] = [];

    for (const archivo of archivosDeCodigo(RAIZ)) {
      const fuente = readFileSync(archivo, "utf8");
      const importes = fuente.matchAll(REGEX_IMPORT_CSS);

      for (const importe of importes) {
        const destino = normalize(join(archivo, "..", importe[1]));

        if (!existsSync(destino)) {
          rotos.push(
            `${archivo.replace(`${RAIZ}/`, "")} → ${importe[1]}`,
          );
        }
      }
    }

    expect(rotos, `Imports de .module.css que no resuelven:\n${rotos.join("\n")}`)
      .toEqual([]);
  });
});
