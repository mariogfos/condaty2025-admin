/**
 * S119 (front) - Source-parsing pin para DownloadHistory.
 *
 * Pinea INTENCION (no efectividad) de los features S119:
 * 1. Dropdown "Modulo" pinea type en el GET del back.
 * 2. Boton "Limpiar historial" pinea DELETE /api/v3/reports
 *    con Bearer + API_BASE_URL.
 * 3. Confirm modal obligatorio antes del DELETE (HALLAZGO-NEW-26).
 * 4. Multi-tenant implicito: el back filtra por user_id del token
 *    (HALLAZGO-NEW-21). El front NUNCA envia user_id.
 * 5. Pin canonico /v3/reports (HALLAZGO-NEW-20/22) - NO legacy alias.
 *
 * HALLAZGO-NEW-29: vitest con S118 S118b no los detecta.
 * Usar Sprint119* para evitar el bug.
 *
 * HALLAZGO-NEW-03: source-parsing pinea INTENCION. Los e2e con
 * un back mockeado pinean EFECTIVIDAD. Ambos deben correr juntos.
 */
import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";

const COMPONENT_PATH = path.resolve(
  __dirname,
  "../DownloadHistory.tsx",
);

const ASYNC_EXPORT_BUTTON_PATH = path.resolve(
  __dirname,
  "../../AsyncExportButton/AsyncExportButton.tsx",
);

let src = "";

describe("S119 (front) - DownloadHistory Modulo filter + Clear", () => {
  beforeAll(() => {
    src = fs.readFileSync(COMPONENT_PATH, "utf-8");
  });

  it("declara type state para el filtro por modulo", () => {
    // S119b: ahora el state pineá `initialType` (no null hardcoded).
    // Back-compat: si el parent no pinea initialType, default null.
    expect(src).toMatch(
      /const\s+\[\s*type\s*,\s*setType\s*\]\s*=\s*useState\s*<\s*string\s*\|\s*null\s*>\s*\(\s*initialType\s*\)/,
    );
  });

  it("declara showClearConfirm y clearing state para el flow Clear", () => {
    expect(src).toMatch(
      /const\s+\[\s*showClearConfirm\s*,\s*setShowClearConfirm\s*\]\s*=\s*useState/,
    );
    expect(src).toMatch(
      /const\s+\[\s*clearing\s*,\s*setClearing\s*\]\s*=\s*useState/,
    );
  });

  it("declara KNOWN_TYPES con la lista de modulos", () => {
    expect(src).toMatch(/const\s+KNOWN_TYPES\s*:/);
    expect(src).toContain("payments");
    expect(src).toContain("outlays");
    expect(src).toContain("expenses");
    expect(src).toContain("accesses");
    expect(src).toContain("defaulters");
  });

  it("el GET pinea type en query string cuando hay filtro seleccionado", () => {
    // HALLAZGO-NEW-20: pinear endpoint canonico /v3/reports.
    // HALLAZGO-NEW-21: URL absoluta via API_BASE_URL.
    // El codigo usa template literal: `${API_BASE_URL}/v3/reports?...`
    expect(src).toMatch(/`\$\{API_BASE_URL\}\/v3\/reports/);
    expect(src).toMatch(/params\.set\(\s*["']type["']\s*,\s*type\s*\)/);
  });

  it("el GET NO pinea user_id - multi-tenant viene del token", () => {
    // HALLAZGO-NEW-21: el front NUNCA envia user_id en query string.
    // Si alguien lo agrega, IDOR attack es trivial.
    expect(src).not.toMatch(/params\.set\(\s*["']user_id["']/);
  });

  it("el Clear button pinea DELETE al endpoint canonico /v3/reports", () => {
    // HALLAZGO-NEW-20: endpoint canonico. HALLAZGO-NEW-22: NO legacy alias.
    // HALLAZGO-NEW-24: API_BASE_URL ya tiene /api, no concatenar /api/extra.
    // El codigo usa template literal: `${API_BASE_URL}/v3/reports`
    expect(src).toMatch(/method:\s*["']DELETE["']/);
    expect(src).toMatch(/`\$\{API_BASE_URL\}\/v3\/reports`/);
  });

  it("el Clear pinea Authorization Bearer token HALLAZGO-NEW-21", () => {
    // El delete request debe pinear Bearer. Si no lo pinea, el back
    // retorna 401 y el historial no se borra.
    const handleClearMatch = src.match(
      /handleClear[\s\S]*?fetch\([\s\S]*?\{([\s\S]*?)\}\s*\)/,
    );
    expect(handleClearMatch).not.toBeNull();
    expect(handleClearMatch![1]).toMatch(
      /Authorization:\s*[`"']Bearer\s*\$\{token\}/,
    );
  });

  it("el Clear pinea confirm modal NewModal antes del DELETE HALLAZGO-NEW-26", () => {
    // El modal debe pinearse ANTES de pinear el DELETE. El NewModal
    // tiene buttonText que pinea onSave=handleClear.
    expect(src).toMatch(/<NewModal[\s\S]*?title=["']\u00bfLimpiar historial\?["']/);
    expect(src).toMatch(/onSave=\{handleClear\}/);
  });

  it("el Clear button tiene data-testid download-history-clear-btn", () => {
    expect(src).toMatch(/data-testid=["']download-history-clear-btn["']/);
  });

  it("el dropdown tiene data-testid download-history-type-filter", () => {
    expect(src).toMatch(/data-testid=["']download-history-type-filter["']/);
  });

  it("el filter bar tiene data-testid download-history-filter-bar", () => {
    expect(src).toMatch(/data-testid=["']download-history-filter-bar["']/);
  });

  it("pinea la prop opcional hideClearButton para back-compat", () => {
    // S119: prop opcional para que parents que pinean Clear desde
    // otro lado puedan ocultar el boton. Default false.
    expect(src).toMatch(/hideClearButton\?:\s*boolean/);
    expect(src).toMatch(/hideClearButton\s*=\s*false/);
  });

  it("pinea la prop opcional onClearCompleted callback", () => {
    // S119: callback cuando el Clear termina bien. Util para toasts.
    expect(src).toMatch(/onClearCompleted\?:\s*\(\s*deletedReports/);
  });

  it("resetea page a 1 cuando cambia type o status", () => {
    // S119: si cambia el filtro y estas en page=5, no tiene sentido.
    expect(src).toMatch(
      /useEffect\(\s*\(\s*\)\s*=>\s*\{\s*setPage\(1\)\s*;\s*\}\s*,\s*\[type\s*,\s*status\]\s*\)/,
    );
  });

  it("pinea Trash2 icon para el boton Clear", () => {
    expect(src).toMatch(
      /import\s*\{[^}]*Trash2[^}]*\}\s*from\s*["']lucide-react["']/,
    );
    expect(src).toMatch(/<Trash2\s+size=\{14\}\s*\/>/);
  });

  // ─────────────────────────────────────────────────────────────────
  // S123 — dropdown consume types del back vía /v3/reports/types
  // (HALLAZGO-NEW-32: derivá keys del back, NO hardcodees).
  // ─────────────────────────────────────────────────────────────────

  it("S123: pinea funcion fetchAvailableTypes que consume /v3/reports/types", () => {
    // El componente debe fetchar los types del back en vez de usar
    // KNOWN_TYPES hardcoded. Drift imposible.
    expect(src).toMatch(
      /async\s+function\s+fetchAvailableTypes\s*\(\s*\)\s*:\s*Promise\s*<\s*string\[\]\s*>/,
    );
    expect(src).toMatch(/`\$\{API_BASE_URL\}\/v3\/reports\/types`/);
  });

  it("S123: pinea useEffect que llama fetchAvailableTypes en mount", () => {
    // Solo se ejecuta UNA VEZ en mount (deps vacias) para no spammear
    // el endpoint en cada cambio de filtro.
    expect(src).toMatch(
      /useEffect\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?fetchAvailableTypes\(\)[\s\S]*?\}\s*,\s*\[\s*\]\s*\)/,
    );
  });

  it("S123: pinea state availableTypes para los types del back", () => {
    // El state se inicializa con KNOWN_TYPES hardcoded como fallback,
    // pero se sobreescribe con la response del back.
    expect(src).toMatch(
      /const\s+\[\s*availableTypes\s*,\s*setAvailableTypes\s*\]\s*=\s*useState/,
    );
  });

  it("S123: el dropdown usa availableTypes en vez de KNOWN_TYPES hardcoded", () => {
    // El typeOptions useMemo se deriva de availableTypes (no de KNOWN_TYPES).
    expect(src).toMatch(
      /typeOptions\s*=\s*useMemo\(\s*\(\)\s*=>\s*\{[\s\S]*?return\s+availableTypes\.map/,
    );
  });

  it("S123: fetchAvailableTypes tiene fallback silencioso a KNOWN_TYPES", () => {
    // Si el endpoint falla, fallback al KNOWN_TYPES hardcoded para
    // que el dropdown no quede vacío. Defensa best-effort.
    expect(src).toMatch(/return\s+KNOWN_TYPES\.map\(\s*\(\s*t\s*\)\s*=>\s*t\.value\s*\)/);
  });

  it("S123: el helper KNOWN_TYPES sigue existiendo como label map (no se borra)", () => {
    // KNOWN_TYPES se pineá como label map (los labels humanizados).
    // El back es SSoT para los values, el front pineá KNOWN_TYPES solo
    // para mapear values a labels bonitos.
    expect(src).toContain("const KNOWN_TYPES:");
  });

  it("S123: KNOWN_TYPES incluye values plurales (owners, homeowners, reservations) — NO singulares", () => {
    // HALLAZGO-NEW-32 + HALLAZGO-NEW-31: el KNOWN_TYPES pinea los
    // values exactos del back (plurales, SSoT = ReportTypeRegistry).
    // Si alguien pinea singulares (owner, homeowner, reservation),
    // el filter no matchea.
    expect(src).toMatch(/value:\s*["']owners["']/);
    expect(src).toMatch(/value:\s*["']homeowners["']/);
    expect(src).toMatch(/value:\s*["']reservations["']/);
  });

  // ─────────────────────────────────────────────────────────────────
  // S119b — pre-seleccionar módulo en el dropdown cuando el modal
  // se abre desde un módulo específico (e.g. AsyncExportButton).
  // ─────────────────────────────────────────────────────────────────

  it("S119b: pinea la prop opcional initialType string or null", () => {
    // Back-compat: default null (Todos). Parents pinean initialType
    // para pre-seleccionar el módulo.
    expect(src).toMatch(/initialType\?:\s*string\s*\|\s*null/);
  });

  it("S119b: pinea initialType con default null en el destructuring", () => {
    // La prop debe tener un valor default para back-compat. Si un
    // parent viejo no la pineá, initialType = null = "Todos".
    expect(src).toMatch(/initialType\s*=\s*null/);
  });

  it("S119b: el useState de type arranca con initialType", () => {
    // El state del filtro debe inicializarse con initialType, NO con
    // null hardcoded. Si pineás `useState<string | null>(null)` en
    // vez de `useState<string | null>(initialType)`, el initialType
    // prop es inútil.
    expect(src).toMatch(
      /useState\s*<\s*string\s*\|\s*null\s*>\s*\(\s*initialType\s*\)/,
    );
  });
});

// ─────────────────────────────────────────────────────────────────
// S119b — integración en AsyncExportButton (pasa initialType)
// ─────────────────────────────────────────────────────────────────

describe("S119b (front) - AsyncExportButton pinea initialType en DownloadHistoryModal", () => {
  let asyncSrc = "";
  beforeAll(() => {
    asyncSrc = fs.readFileSync(ASYNC_EXPORT_BUTTON_PATH, "utf-8");
  });

  it("AsyncExportButton pinea initialType=type en el DownloadHistoryModal", () => {
    // S119b: cuando el user está en Outlays (type=outlays) y click
    // "Historial", el modal debe arrancar con initialType=outlays.
    // El componente ya tiene la prop `type: string` (la que se pineá
    // al POST /export). Solo necesitamos pinearla al modal.
    expect(asyncSrc).toMatch(
      /<DownloadHistoryModal[\s\S]*?initialType=\{type\}/,
    );
  });

  it("AsyncExportButton sigue pineando open y onClose en el modal", () => {
    // Back-compat: las props originales pineadas.
    expect(asyncSrc).toMatch(/<DownloadHistoryModal[\s\S]*?open=\{historyOpen\}/);
    expect(asyncSrc).toMatch(/<DownloadHistoryModal[\s\S]*?onClose=\{[\s\S]*?setHistoryOpen\(false\)[\s\S]*?\}/);
  });
});
