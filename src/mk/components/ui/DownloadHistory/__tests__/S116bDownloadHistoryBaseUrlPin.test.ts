/**
 * S116b front — Pin de regresión para el bug "DownloadHistory no carga historial".
 *
 * Historia del bug (2026-07-27, Mario):
 *   Después de mergear S113/S115/S117 (useAsyncExport con baseURL +
 *   Bearer + buildBackendUrl), el componente `DownloadHistory`
 *   nuevo pineá `fetch("/api/v3/reports")` con RUTA RELATIVA — el
 *   navegador la resuelve contra `window.location.origin` (el front
 *   en :3000), no contra el back en :8000. Resultado: 404 silencioso
 *   y el componente muestra "Aún no generaste ningún reporte"
 *   siempre.
 *
 * HALLAZGO-NEW-21 (binding, cross-project): cualquier `fetch()` que
 * pineá una URL del BACK debe pinear el baseURL del back
 * (`process.env.NEXT_PUBLIC_API_URL`), NO ruta relativa.
 *
 * HALLAZGO-NEW-24 (binding, cross-project): cuando `API_BASE_URL`
 * termina en `/api` y el back pineá `route()` con `/api/...`, pinear
 * helper `buildBackendUrl()` que strip `/api` para evitar doble
 * `/api/`. Patrón ya pineado en S117 sobre useAsyncExport.
 *
 * HALLAZGO-NEW-20 (binding, cross-project): pinear endpoint canónico
 * `/v3/reports` (NO legacy alias `/api/reports` con Controller roto
 * HALLAZGO-NEW-22).
 *
 * HALLAZGO-NEW-03 (binding, cross-project): source-parsing pinea
 * INTENCIÓN. Si alguien pineá restaurar fetch("/api/v3/reports")
 * o quita el `Authorization: Bearer`, el test falla con mensaje claro.
 *
 * Cross-IA: Mavis main el 2026-07-27.
 * Refs: S32 (reports async infra), S66.5 (exportAsync slot),
 *       S113/S115/S117 (useAsyncExport baseURL + Bearer + buildBackendUrl),
 *       S116b back (PR #204, GET /api/v3/reports), S116b front (este sprint).
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const FRONT_ROOT = process.cwd();
const COMPONENT_PATH = path.join(
  FRONT_ROOT,
  "src/mk/components/ui/DownloadHistory/DownloadHistory.tsx",
);

describe("S116b front — DownloadHistory baseURL + auth pin", () => {
  it("DownloadHistory.tsx NO usa ruta relativa /api/v3/reports/ (pineaba 404 al front)", () => {
    const src = fs.readFileSync(COMPONENT_PATH, "utf8");
    // El bug original pineá `fetch("/api/v3/reports")` que se
    // resolvía contra el front (:3000), no contra el back (:8000).
    // S116b fix pineá `${API_BASE_URL}/v3/reports` con baseURL del back.
    expect(src).not.toMatch(/fetch\([^)]*["'`]\/api\/v3\/reports/);
  });

  it("DownloadHistory.tsx pinea /v3/reports (canónico, no legacy alias)", () => {
    const src = fs.readFileSync(COMPONENT_PATH, "utf8");
    // S116b back (PR #204) pineá el canónico `/v3/reports`. NO el legacy
    // `/api/reports` (HALLAZGO-NEW-22 — Controller con getNameModel roto).
    expect(src).toMatch(/\$\{API_BASE_URL\}\/v3\/reports/);
    // Anti-regresión: NO pinea el legacy alias `/reports` (sin v3).
    expect(src).not.toMatch(/\$\{API_BASE_URL\}\/reports/);
  });

  it("DownloadHistory.tsx pinea API_BASE_URL desde NEXT_PUBLIC_API_URL", () => {
    const src = fs.readFileSync(COMPONENT_PATH, "utf8");
    // Mismo patrón que S113 pineó en useAsyncExport.
    expect(src).toMatch(/API_BASE_URL\s*=/);
    expect(src).toMatch(/NEXT_PUBLIC_API_URL/);
  });

  it("DownloadHistory.tsx pinea el token Bearer para auth (no rompe Sanctum)", () => {
    const src = fs.readFileSync(COMPONENT_PATH, "utf8");
    // Sin el token, el back retorna 401 (Sanctum requiere Authorization
    // header con Bearer <token> del personal_access_token).
    expect(src).toMatch(/Authorization:\s*[`"]Bearer\s+\$\{token\}[`"]/);
    expect(src).toMatch(/getAuthToken\s*\(/);
  });

  it("DownloadHistory.tsx usa credentials: 'include' (CORS cross-domain)", () => {
    const src = fs.readFileSync(COMPONENT_PATH, "utf8");
    // El back pinea supports_credentials: true en CORS. El front debe
    // pinear credentials: 'include' para enviar cookies cross-domain.
    expect(src).toMatch(/credentials:\s*['"]include['"]/);
  });

  it("DownloadHistory.tsx pinea buildBackendUrl helper (S117 pattern, anti double-/api/)", () => {
    const src = fs.readFileSync(COMPONENT_PATH, "utf8");
    // S117: el download_url que viene del back (vía route()) empieza con
    // /api/...; concatenar con API_BASE_URL (que ya termina en /api)
    // pineá DOBLE /api/ → 404. El helper buildBackendUrl() strip /api.
    expect(src).toMatch(/const buildBackendUrl\s*=/);
    expect(src).toMatch(/buildBackendUrl\(item\.download_url\)/);
    // Anti-regresión: el default download flow NO pinea
    // `fetch(item.download_url)` directo (sin helper).
    expect(src).not.toMatch(/fetch\(\s*item\.download_url\s*\)/);
    // Anti-regresión: el default download flow NO pinea la concatenación
    // directa `${API_BASE_URL}${item.download_url}` que pineá doble /api.
    expect(src).not.toMatch(/\$\{API_BASE_URL\}\$\{item\.download_url\}/);
  });
});
