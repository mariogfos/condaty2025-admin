/**
 * S118 front — Pin de regresión para el fix "useCrud merge extraParams
 * con filterBy/searchBy".
 *
 * Historia del bug (2026-07-27, Mario):
 *   Pre-S118: useCrud pinea `params={mod.exportAsync.extraParams}` SOLO.
 *   Si pineabas `extraParams: { title: "X" }`, los `filterBy` + `searchBy`
 *   del store se PERDÍAN. El user clickeaba "Exportar" con un filtro
 *   activo y el PDF salía con TODOS los datos (sin filtro).
 *
 * Fix (S118):
 *   useCrud ahora merge `extraParams` CON `filterBy` + `searchBy`:
 *   `params={{ ...(extraParams ?? {}), filterBy, searchBy, exportCols? }}`
 *   Así, el `title` y los filtros se pinean juntos al back.
 *
 * Cross-project: aplica a TODOS los `mod.exportAsync` con `extraParams`.
 * El patrón canónico es `extraParams: { title: "X", ... }` (S118) +
 * useCrud merge (no override) — back recibe `params.title` Y `params.filterBy`.
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const FRONT_ROOT = process.cwd();
const USE_CRUD_PATH = path.join(FRONT_ROOT, "src/mk/hooks/useCrud/useCrud.tsx");

describe("S118 front — useCrud merge extraParams con filterBy/searchBy", () => {
  it("useCrud.tsx usa spread de extraParams (no asignacion directa)", () => {
    const source = fs.readFileSync(USE_CRUD_PATH, "utf8");
    expect(source).toMatch(/\.\.\.\(mod\.exportAsync\?\.extraParams\s*\?\?\s*\{\}\)/);
  });

  it("useCrud.tsx NO hace return directo de extraParams (debe mergear con filterBy)", () => {
    const source = fs.readFileSync(USE_CRUD_PATH, "utf8");
    expect(source).not.toMatch(/return\s+mod\.exportAsync\?\.extraParams;/);
  });

  it("useCrud.tsx pinea filterBy en out (después de spread de extraParams)", () => {
    const source = fs.readFileSync(USE_CRUD_PATH, "utf8");
    expect(source).toMatch(/if\s*\(\s*params\?\.filterBy\s*\)\s*out\.filterBy\s*=\s*params\.filterBy/);
  });

  it("useCrud.tsx pinea searchBy en out (después de spread de extraParams)", () => {
    const source = fs.readFileSync(USE_CRUD_PATH, "utf8");
    expect(source).toMatch(/if\s*\(\s*params\?\.searchBy\s*\)\s*out\.searchBy\s*=\s*params\.searchBy/);
  });
});
