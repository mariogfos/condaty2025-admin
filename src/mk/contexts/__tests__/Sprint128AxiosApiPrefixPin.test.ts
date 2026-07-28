/**
 * S128 (front) - Source-parsing pin + e2e test para HALLAZGO-NEW-38.
 *
 * Problema: `AxiosInstanceProvider` configura `baseURL` desde
 * `process.env.NEXT_PUBLIC_API_URL` que típicamente termina en `/api`
 * (e.g. `http://127.0.0.1:8000/api`). Los componentes pinean
 * `axios.request({ url: "/api/v3/..." })` con path con prefijo `/api/`.
 *
 * Axios concatena `baseURL + url` → `http://127.0.0.1:8000/api/api/v3/reservations`
 * → 404 NotFoundHttpException.
 *
 * Mario reportó: "en el menu calendar sale este error: The route
 * api/api/v3/reservations could not be found." — eso confirma el doble
 * `/api/`.
 *
 * Es la versión **axios** de HALLAZGO-NEW-24 (S117 pineó el bug para
 * `fetch()`, pero `axios` quedó sin tocar). S128 barre TODOS los
 * `axios.request/get/post/put/patch/delete` con `url: "/api/..."` y
 * pinea el path canónico sin prefijo.
 *
 * HALLAZGO-NEW-29: vitest con S118 S118b no los detecta. Usar Sprint128*.
 *
 * HALLAZGO-NEW-03: source-parsing pinea INTENCIÓN. Los e2e con mock
 * pinean EFECTIVIDAD. Ambos deben correr juntos.
 */
import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";

const FRONT_ROOT = process.cwd();
const SRC_DIR = path.join(FRONT_ROOT, "src");

/**
 * Recorre `src/` recursivamente y devuelve todos los archivos `.ts`/`.tsx`
 * (excluyendo `__tests__/` para no pinear el propio test).
 */
function walkSrc(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__" || entry.name === "node_modules") continue;
      walkSrc(full, out);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

describe("S128 (front) - axios.url drop /api prefix pin (HALLAZGO-NEW-38)", () => {
  let files: string[] = [];

  beforeAll(() => {
    files = walkSrc(SRC_DIR);
  });

  // --- SOURCE-PARSING PINE GENÉRICO CROSS-PROJECT ---

  it("S128 pin genérico: ningún archivo pineá axios.request/get/post/... con url: '/api/...'", () => {
    // Anti-pattern: `url: "/api/..."` cuando se usa axios con baseURL
    // que ya termina en `/api`. Axios concatena y pineá DOBLE `/api/`
    // → 404.
    //
    // El pin genérico barre TODOS los archivos .ts/.tsx de src/ (excluyendo
    // __tests__/) y rechaza cualquier línea que pineá:
    //   - `url: "/api/..."` en axios.request/get/post/put/patch/delete
    //   - `url: '/api/...'` (comilla simple)
    //   - `url: `/api/...`` (backtick)
    //
    // El patrón canónico post-S128: `url: "/v3/..."` (sin prefijo /api).
    const violations: { file: string; line: number; match: string }[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, "utf-8");
      const lines = content.split("\n");

      lines.forEach((line, index) => {
        // Solo líneas que pineán `url: "..."` o `url: '...'` o `url: `...``
        // dentro de un contexto axios (request/get/post/put/patch/delete).
        //
        // Estrategia simple: matchear `url:\s*["'`]?/api/` (cualquier
        // comilla o backtick, path que empieza con `/api/`).
        const m = line.match(/url:\s*["'`]?\/api\//);
        if (m) {
          violations.push({
            file: path.relative(FRONT_ROOT, file),
            line: index + 1,
            match: line.trim(),
          });
        }
      });
    }

    if (violations.length > 0) {
      const formatted = violations
        .map((v) => `  ${v.file}:${v.line}\n    ${v.match}`)
        .join("\n");
      throw new Error(
        `HALLAZGO-NEW-38: ${violations.length} archivo(s) pinean ` +
          `url: "/api/..." con axios. Axios concatena con baseURL que ya ` +
          `termina en /api → DOBLE /api/ → 404.\n` +
          `Fix: cambiar url: "/api/v3/X" → url: "/v3/X" (drop prefijo /api).\n` +
          `Archivos:\n${formatted}`,
      );
    }
    expect(violations).toEqual([]);
  });

  it("S128 pin: AxiosInstanceProvider baseURL viene de NEXT_PUBLIC_API_URL", () => {
    // El pin complementario: la SSoT del baseURL es
    // `process.env.NEXT_PUBLIC_API_URL`. Si alguien refactorea a
    // hardcodear `http://localhost:8000/api`, el pin grita.
    const providerPath = path.join(
      SRC_DIR,
      "mk/contexts/AxiosInstanceProvider.tsx",
    );
    const src = fs.readFileSync(providerPath, "utf-8");
    expect(src).toMatch(/NEXT_PUBLIC_API_URL/);
  });

  it("S128 pin: helper buildBackendUrl pinea strip /api (HALLAZGO-NEW-24 backward-compat)", () => {
    // El helper buildBackendUrl pinea en useAsyncExport.ts y
    // DownloadHistory.tsx. S117 lo pineó para fetch(). S128 pinea que
    // el helper sigue pineando el strip /api/ (consistencia con la
    // nueva convención drop-prefix).
    const useAsyncExport = fs.readFileSync(
      path.join(SRC_DIR, "mk/hooks/useAsyncExport/useAsyncExport.ts"),
      "utf-8",
    );
    const downloadHistory = fs.readFileSync(
      path.join(SRC_DIR, "mk/components/ui/DownloadHistory/DownloadHistory.tsx"),
      "utf-8",
    );
    expect(useAsyncExport).toMatch(/buildBackendUrl/);
    expect(useAsyncExport).toMatch(/path\.startsWith\(["']\/api\/["']\)/);
    expect(downloadHistory).toMatch(/buildBackendUrl/);
    expect(downloadHistory).toMatch(/path\.startsWith\(["']\/api\/["']\)/);
  });
});
