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

let src = "";

describe("S119 (front) - DownloadHistory Modulo filter + Clear", () => {
  beforeAll(() => {
    src = fs.readFileSync(COMPONENT_PATH, "utf-8");
  });

  it("declara type state para el filtro por modulo", () => {
    expect(src).toMatch(
      /const\s+\[\s*type\s*,\s*setType\s*\]\s*=\s*useState\s*<\s*string\s*\|\s*null\s*>\s*\(\s*null\s*\)/,
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
});
