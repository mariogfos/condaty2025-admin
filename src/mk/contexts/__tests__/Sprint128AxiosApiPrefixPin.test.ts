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

  /**
   * 🔴 Los dos barridos de abajo afirman "no hay culpables". Si el recorrido
   * se rompe —`src/` que se mueve, una extensión mal escrita, un `cwd`
   * distinto— la lista sale vacía POR ESO y los dos quedan verdes para
   * siempre, anunciando una cobertura que no existe.
   *
   * No es hipotético: `SprintS137FeCriticalFixesPin.test.ts` vivía en este
   * repo armando rutas `src/src/...` que no existían, y sus cuatro tests no
   * leyeron un solo archivo en su vida (CDT-46, corte 4).
   */
  it("el barrido efectivamente lee el código de la app", () => {
    expect(files.length).toBeGreaterThan(100);
    expect(files).toContain(
      path.join(SRC_DIR, "mk/contexts/AxiosInstanceProvider.tsx"),
    );
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

  /**
   * 🔴 El pin de arriba estaba en verde con el bug puesto, y por eso existe
   * éste (2026-08-05).
   *
   * Aquel busca la clave literal `url:` —la forma de un objeto de config de
   * axios—. Pero la app NO llama a axios así: llama a `execute("/ruta", ...)`,
   * con el path como PRIMER ARGUMENTO POSICIONAL. `MaintenanceModal` de Áreas
   * tenía TRES llamadas con `execute("/api/v3/reservations", ...)`, que
   * terminaban en `.../api/api/v3/reservations` → 404, y el pin genérico no
   * las veía.
   *
   * ⚠️ Es el mismo error de siempre: el test medía con la lente de la forma en
   * que se descubrió el bug la primera vez, no de la forma en que el código
   * realmente hace las llamadas.
   */
  it("ningún execute() pinea un path que arranca con /api/", () => {
    const violations: string[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, "utf-8");

      // ⚠️ Sobre TODO el contenido, no línea por línea. La primera versión de
      // este test escaneaba renglón a renglón y se comió el bug que venía a
      // pinear: `execute(` y el path están en LÍNEAS DISTINTAS en casi todas
      // las llamadas de la app, porque prettier las parte:
      //
      //     await execute(
      //       "/api/v3/reservations",     ← el path, un renglón más abajo
      //       "GET",
      //
      // Descubierto reinyectando el bug: el test quedaba en verde. Sin esa
      // reinyección habría commiteado un pin decorativo.
      const re = /execute\(\s*["'`]\/api\//g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(content)) !== null) {
        const linea = content.slice(0, m.index).split("\n").length;
        violations.push(
          `${path.relative(FRONT_ROOT, file)}:${linea}\n    ${m[0].replace(/\s+/g, " ")}…`,
        );
      }
    }

    expect(
      violations,
      `execute() concatena con el baseURL, que ya termina en /api. Un path ` +
        `que arranca con /api/ da .../api/api/... → 404. Sacá el prefijo: ` +
        `"/api/v3/x" → "/v3/x".\n${violations.join("\n")}`,
    ).toEqual([]);
  });

  /**
   * Acá vivían otros dos pines de texto. Se fueron en CDT-46, corte 4:
   *
   * - "AxiosInstanceProvider baseURL viene de NEXT_PUBLIC_API_URL": miraba
   *   que el string estuviera escrito. Lo reemplaza
   *   `elBaseUrlDeAxiosSaleDelEnv.test.tsx`, que arma el provider y mira el
   *   `baseURL` con el que quedó el axios.
   *
   * - "helper buildBackendUrl pinea strip /api": miraba que existiera un
   *   `const buildBackendUrl =` y un `path.startsWith("/api/")`. Se rompió
   *   el helper a mano dejando esas dos líneas intactas —o sea, el bug
   *   S117 exacto, la URL de descarga con `/api/api/`— y la suite entera
   *   quedó verde. Lo reemplazan
   *   `useAsyncExport/__tests__/laUrlQueSaleAlBackend.test.ts` y
   *   `DownloadHistory/__tests__/DownloadHistoryLasRequestsQueSalen.test.tsx`,
   *   que miran la URL que sale por `fetch`.
   */
});
