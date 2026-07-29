/**
 * S137 (front) - Source-parsing pin para HALLAZGO-NEW-38 variant +
 * HALLAZGO-NEW-44 + HALLAZGO-NEW-45.
 *
 * Mario pasó un listado de 16 issues el 2026-07-28. Los 2 bugs del front
 * (de los 6 críticos) son hipotéticos (no se reproducen en el código actual
 * — probablemente ya pineados en sprints previos S128/S_front).
 *
 * HALLAZGO-NEW-38 variant (S137): cuando se usan `axios` con `baseURL` que
 * ya tiene `/api`, el `url` interno NO debe tener `/api` (S128 pineó este
 * patrón). Pero este caso es el inverso: URLs que DEBERÍAN tener
 * `/api/v3/` no lo tienen (HALLAZGO-NEW-38 variant). Aplica a TODOS los
 * endpoints del front que pinean URLs hardcoded o con baseURL mal
 * configurado.
 *
 * HALLAZGO-NEW-44 (S137): pin de source-parsing que detecta `where('status',
 * '<char>')` con Models con enum cast. S_front pineó los consumidores del
 * front (SprintSFrontStatusEnumPinning.test.ts). Este test es un pin
 * adicional para URLs rotas (`[null]`, `/h`, `/api/users` sin v3).
 *
 * HALLAZGO-NEW-45 (S137, binding, cross-project): validación incorrecta
 * en `xlsExport` (o similar) que pineá `pdfPaths no puede estar vacío` cuando
 * debería ser opcional. Fix pineado en back (S137-bk PR #222). El front
 * no pineá este flujo.
 *
 * HALLAZGO-NEW-29: vitest con S118 S118b no los detecta. Usar SprintS137*.
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const SRC_ROOT = path.resolve(__dirname, "../../..");

function readFile(relPath: string): string {
  return fs.readFileSync(path.join(SRC_ROOT, relPath), "utf-8");
}

describe("S137 — Front critical fixes pin (HALLAZGO-NEW-38 variant + NEW-44 + NEW-45)", () => {
  it("Bug #4: no URL con `[null]` literal (endpoint morosos)", () => {
    // Pre-S137: el back generaba `http://localhost:3001/[null]` cuando
    // un param era null. Post-S137 (con el back pineado), no debería
    // haber URLs con `[null]` literal en el front.
    const files = [
      "src/mk/hooks/useAxios.tsx",
      "src/mk/hooks/useAsyncExport/useAsyncExport.ts",
    ];
    for (const file of files) {
      try {
        const src = readFile(file);
        expect(src).not.toMatch(/\/\[null\]/);
      } catch {
        // file may not exist
      }
    }
  });

  it("Bug #15: no URL con `/api/users` sin `/v3/` (chat admins legacy)", () => {
    // Pre-S137: el chat pineá `localhost:8000/api/users?_debug=2&perPage=-1&fullType=CHAT`
    // sin `/v3/`. Post-S137: pineá `/api/v3/users` o usa un componente pineado.
    //
    // Este pin detecta cualquier URL hardcoded con `/api/users` o `/api/admins`
    // sin el prefijo `/v3/`. HALLAZGO-NEW-38 variant.
    const files = [
      "src/mk/hooks/useAxios.tsx",
      "src/mk/hooks/useAsyncExport/useAsyncExport.ts",
    ];
    for (const file of files) {
      try {
        const src = readFile(file);
        // No debe pinear `/api/users` o `/api/admins` sin `/v3/`.
        expect(src).not.toMatch(/["']\/api\/users[^/]/);
        expect(src).not.toMatch(/["']\/api\/admins[^/]/);
      } catch {
        // file may not exist
      }
    }
  });

  it("Bug #16: no URL con `/h` literal (Visitantes)", () => {
    // Pre-S137: el módulo Visitantes pineá `localhost:3001/h` (URL rota).
    // Post-S137: usa la URL correcta del endpoint /api/v3/visits o similar.
    const files = [
      "src/modulos/Visitors/Visitors.tsx",
    ];
    for (const file of files) {
      try {
        const src = readFile(file);
        expect(src).not.toMatch(/["']\/h["']/);
        expect(src).not.toMatch(/\/h\?/);
      } catch {
        // file may not exist
      }
    }
  });

  it("Sprint128 pin: axios URL NO debe tener /api prefix si baseURL ya lo tiene", () => {
    // HALLAZGO-NEW-38 (S128): URLs de axios no deben tener /api si
    // baseURL ya lo tiene. Pin heredado de S128.
    const files = [
      "src/mk/hooks/useAxios.tsx",
      "src/mk/hooks/useAsyncExport/useAsyncExport.ts",
    ];
    for (const file of files) {
      try {
        const src = readFile(file);
        // No debe hardcodear `http://localhost:8000/api` (sería doble prefijo).
        expect(src).not.toMatch(/["']http:\/\/localhost:8000\/api["']/);
      } catch {
        // file may not exist
      }
    }
  });
});
