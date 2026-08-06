/**
 * Fase 6 — `endpoint` y `supportedFormats` son UNA sola cosa.
 *
 * 🔴 El bug que este test existe para que no vuelva (2026-08-05, módulo
 * Residentes): se migró el back, se pineó `endpoint` en el `exportAsync`... y
 * el export siguió yendo por el motor viejo. Después reventó, porque el
 * ReportType legacy ya estaba borrado.
 *
 * La causa está en `useCrud`: elige el botón mirando **sólo**
 * `supportedFormats`.
 *
 *   - con el array  → `<DownloadButton ... endpoint={mod.exportAsync.endpoint} />`
 *   - sin el array  → `<AsyncExportButton ... />`  ← NO recibe `endpoint`
 *
 * O sea que sin `supportedFormats` el `endpoint` no se ignora un poco: **no
 * llega nunca**. Y el síntoma visible es otro —aparecen dos botones,
 * "Exportar PDF" y "Historial", en vez del ícono con menú—, así que es fácil
 * leerlo como un detalle de estilo y no como lo que es: el módulo sigue
 * enchufado al motor legacy.
 *
 * ⚠️ Esto es source-parsing, con todo lo que eso implica: mide la INTENCIÓN
 * escrita en el config, no el render. Se eligió igual porque el invariante ES
 * de forma —dos claves de un objeto literal que tienen que viajar juntas— y
 * porque su falla no tiene señal en runtime sin montar el CRUD entero. El
 * barrido es sobre TODOS los módulos, así que cubre los 20 que faltan migrar.
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const MODULOS_ROOT = path.resolve(__dirname, "../..");

/** Todos los .ts/.tsx bajo src/modulos, sin tests. */
function archivosDeModulos(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__") continue;
      archivosDeModulos(full, acc);
    } else if (/\.tsx?$/.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

/**
 * Recorta el objeto literal que sigue a `exportAsync:` contando llaves, para
 * no arrastrar el resto del `mod` y dar un falso verde con el
 * `supportedFormats` de otra cosa.
 */
function bloquesExportAsync(src: string): string[] {
  const bloques: string[] = [];
  const re = /exportAsync\s*:\s*\{/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(src)) !== null) {
    let profundidad = 1;
    let i = m.index + m[0].length;
    while (i < src.length && profundidad > 0) {
      if (src[i] === "{") profundidad++;
      else if (src[i] === "}") profundidad--;
      i++;
    }
    bloques.push(src.slice(m.index, i));
  }
  return bloques;
}

describe("exportAsync: endpoint y supportedFormats viajan juntos", () => {
  const archivos = archivosDeModulos(MODULOS_ROOT).filter((f) =>
    fs.readFileSync(f, "utf-8").includes("exportAsync:"),
  );

  it("hay módulos con exportAsync para revisar", () => {
    // Si el barrido deja de encontrar archivos, los tests de abajo pasan
    // vacíos y este archivo se vuelve decorativo.
    expect(archivos.length).toBeGreaterThan(0);
  });

  it("ningún módulo pinea endpoint sin supportedFormats", () => {
    const huerfanos: string[] = [];

    for (const archivo of archivos) {
      const src = fs.readFileSync(archivo, "utf-8");
      for (const bloque of bloquesExportAsync(src)) {
        const sinComentarios = bloque
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/\/\/.*$/gm, "");

        const tieneEndpoint = /\bendpoint\s*:/.test(sinComentarios);
        const tieneFormats = /\bsupportedFormats\s*:/.test(sinComentarios);

        if (tieneEndpoint && !tieneFormats) {
          huerfanos.push(path.relative(MODULOS_ROOT, archivo));
        }
      }
    }

    expect(
      huerfanos,
      `Estos módulos pinean 'endpoint' sin 'supportedFormats': useCrud les ` +
        `renderea el AsyncExportButton legacy, que NO recibe endpoint. El ` +
        `export se va por POST /v3/reports/{type}/export — al motor viejo, o ` +
        `a un 400 si su ReportType ya se borró.`,
    ).toEqual([]);
  });

  /**
   * El otro lado del par. Un `supportedFormats` sin `endpoint` renderea el
   * botón nuevo pero lo manda igual por el flow legacy: el usuario ve el menú
   * de tres formatos y se baja un reporte armado por Dompdf.
   */
  it("ningún módulo pinea supportedFormats sin endpoint", () => {
    const huerfanos: string[] = [];

    for (const archivo of archivos) {
      const src = fs.readFileSync(archivo, "utf-8");
      for (const bloque of bloquesExportAsync(src)) {
        const sinComentarios = bloque
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/\/\/.*$/gm, "");

        const tieneEndpoint = /\bendpoint\s*:/.test(sinComentarios);
        const tieneFormats = /\bsupportedFormats\s*:/.test(sinComentarios);

        if (tieneFormats && !tieneEndpoint) {
          huerfanos.push(path.relative(MODULOS_ROOT, archivo));
        }
      }
    }

    expect(
      huerfanos,
      `Estos módulos pinean 'supportedFormats' sin 'endpoint': el botón nuevo ` +
        `sale, pero el export igual se va por el flow legacy por type.`,
    ).toEqual([]);
  });

  /**
   * Y el `endpoint` tiene que apuntar a la MISMA lista que muestra la
   * pantalla.
   *
   * El back resuelve qué config usar desde el controller que atiende esa URL,
   * así que un endpoint corrido no da error: exporta bien... otra cosa. El
   * usuario filtra Personal y se baja Residentes, con status `completed` y
   * todo. Es la clase de falla que no tiene síntoma hasta que alguien abre el
   * PDF.
   *
   * ⚠️ Sólo se revisan los archivos con UN `modulo:` literal. En los que
   * declaran varios (tabs que arman más de un `mod`) no se puede saber cuál
   * corresponde a cada `exportAsync` sin parsear de verdad, y preferimos no
   * mirar antes que dar un verde inventado. Hoy ninguno de esos tiene
   * `endpoint`: si mañana lo tiene, este test lo saltea en silencio — por eso
   * el conteo de abajo.
   */
  it("el endpoint apunta al mismo modulo que lista la pantalla", () => {
    const corridos: string[] = [];
    let revisados = 0;

    for (const archivo of archivos) {
      const src = fs.readFileSync(archivo, "utf-8");
      const modulos = [...src.matchAll(/\bmodulo\s*:\s*["'`]([^"'`]+)["'`]/g)];
      if (modulos.length !== 1) continue;

      const modulo = modulos[0][1];

      for (const bloque of bloquesExportAsync(src)) {
        const sinComentarios = bloque
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/\/\/.*$/gm, "");

        const endpoint = sinComentarios.match(
          /\bendpoint\s*:\s*["'`]([^"'`]+)["'`]/,
        );
        if (!endpoint) continue;

        revisados++;
        if (endpoint[1].replace(/^\//, "") !== modulo) {
          corridos.push(
            `${path.relative(MODULOS_ROOT, archivo)}: modulo '${modulo}' vs endpoint '${endpoint[1]}'`,
          );
        }
      }
    }

    expect(
      revisados,
      "El barrido no encontró ningún endpoint que revisar: el test quedó decorativo.",
    ).toBeGreaterThan(0);

    expect(
      corridos,
      `Estos módulos exportan una lista distinta de la que muestran. El back ` +
        `elige la config por el controller de esa URL, así que el reporte sale ` +
        `'completed' con el contenido equivocado.`,
    ).toEqual([]);
  });
});
