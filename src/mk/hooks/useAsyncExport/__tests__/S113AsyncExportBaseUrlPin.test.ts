/**
 * S113 — Pin de regresión para el bug "ningún export funciona en ningún módulo".
 *
 * Historia del bug (2026-07-27, Mario):
 *   `useAsyncExport.ts` pineá `fetch(\`/api/v3/reports/${type}/export\`)`
 *   con RUTA RELATIVA. El navegador la resuelve contra `window.location.origin`
 *   (el front en :3000), no contra el back en :8000. Resultado: 404 en
 *   TODOS los exports async (useAsyncExport es el flow canónico de S32/S66.5).
 *
 * HALLAZGO-NEW-21 (binding, cross-project): cualquier `fetch()` que pineá
 * una URL del BACK debe usar el baseURL del back (`process.env.NEXT_PUBLIC_API_URL`),
 * no ruta relativa. Las rutas relativas OK son las que pinean proxies Next.js
 * (`/api/translate`, `/api/cloudinary-upload`) o paths internos del front.
 *
 * HALLAZGO-NEW-03 (binding cross-project): source-parsing pinea INTENCIÓN.
 * Si alguien pineá restaurar fetch("/api/v3/reports/...") o quita el
 * `Authorization: Bearer`, el test falla con mensaje claro.
 *
 * Cross-IA: Mavis main el 2026-07-27.
 * Refs: S32 (NEW-NEW-43 reports async), S66.5 (exportAsync slot),
 *       S103, S111, S112, S113 (este sprint).
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const FRONT_ROOT = path.resolve(__dirname, "..", "..", "..", "..", "..");
const HOOK_PATH = path.join(
  FRONT_ROOT,
  "src/mk/hooks/useAsyncExport/useAsyncExport.ts",
);

describe("S113 — useAsyncExport baseURL + auth pin", () => {
  it("useAsyncExport.ts NO usa ruta relativa /api/v3/reports/ (pineaba 404 al front)", () => {
    const src = fs.readFileSync(HOOK_PATH, "utf8");
    // El bug original pineá `fetch(\`/api/v3/reports/${type}\`)` que se
    // resolvía contra el front (:3000), no contra el back (:8000).
    // S113 fix pineá \`${API_BASE_URL}/reports/${type}\` con baseURL del back.
    expect(src).not.toMatch(/fetch\([^)]*`\/api\/v3\/reports\//);
  });

  it("useAsyncExport.ts pinea API_BASE_URL desde NEXT_PUBLIC_API_URL", () => {
    const src = fs.readFileSync(HOOK_PATH, "utf8");
    // El fix pineá:
    //   const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
    // para construir URLs absolutas al back.
    expect(src).toMatch(/API_BASE_URL\s*=/);
    expect(src).toMatch(/NEXT_PUBLIC_API_URL/);
  });

  it("useAsyncExport.ts pinea el token Bearer para auth (no rompe Sanctum)", () => {
    const src = fs.readFileSync(HOOK_PATH, "utf8");
    // Sin el token, el back retorna 401 (Sanctum requiere Authorization
    // header con Bearer <token> del personal_access_token).
    expect(src).toMatch(/Authorization:\s*[`"]Bearer\s+\$\{getAuthToken\(\)\}[`"]/);
    expect(src).toMatch(/getAuthToken\s*\(/);
  });

  it("useAsyncExport.ts usa credentials: 'include' (CORS cross-domain)", () => {
    const src = fs.readFileSync(HOOK_PATH, "utf8");
    // El back pinea supports_credentials: true en CORS. El front debe
    // pinear credentials: 'include' para enviar cookies cross-domain.
    expect(src).toMatch(/credentials:\s*['"]include['"]/);
  });
});
