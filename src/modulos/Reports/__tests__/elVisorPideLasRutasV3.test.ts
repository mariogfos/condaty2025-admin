import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * El visor del estado de cuenta pide sus cuatro puertas bajo `v3`.
 *
 * El 2026-10-08 el API retiró las rutas de reportes sin `v3` (decisión A4):
 * `GET /reports/{key}/summary|pages|document|xlsx` pasaron a
 * `/v3/reports/{key}/…`. Un visor que siguiera pidiendo la ruta vieja abre
 * vacío con un 404 detrás.
 *
 * ⚠️ Se lee el archivo SIN comentarios (regla 173): los docblocks de este repo
 * citan la ruta vieja para explicarla.
 */
const sinComentarios = (ruta: string): string =>
  readFileSync(ruta, "utf-8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

const visor = sinComentarios(join(__dirname, "..", "ReportsPage.tsx"));

describe("el visor de reportes", () => {
  it.each(["summary", "pages", "document", "xlsx"])("pide %s bajo v3", (puerta) => {
    expect(visor).toContain("`/v3/reports/${reportKey}/" + puerta + "`");
  });

  it("no pide ninguna ruta de reportes sin v3", () => {
    expect(visor).not.toMatch(/[`"']\/reports\//);
  });
});
