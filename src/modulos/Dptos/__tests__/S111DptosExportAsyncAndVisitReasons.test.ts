/**
 * S111 — Pin de regresión para los cambios de cleanup pendientes.
 *
 * Verifica source-parsing que:
 *  1. `src/modulos/Dptos/Dptos.tsx` pineá `mod.exportAsync = { type: "dpto-deudas", ... }`
 *     (el slot del sistema de reports async S38/S66.5).
 *  2. `src/modulos/Dptos/Dptos.tsx` NO contiene la URL legacy `dptos-export-deudas`
 *     (el endpoint que S38 removió del back con R-PKG-016).
 *  3. `src/app/visit-reasons/page.tsx` NO existe (feature dead pineada y borrada).
 *  4. `src/modulos/VisitReasons/` NO existe (módulo pineado a NotAccess + borrado).
 *  5. `src/components/MainMenu/mainMenuConfig.ts` NO contiene entry `visit-reasons`
 *     (S103 fix pineó el menú removido).
 *
 * HALLAZGO-NEW-03 (binding cross-project): source-parsing pinea INTENCIÓN,
 * NO EFECTIVIDAD. Si alguien restaura el endpoint legacy o el módulo dead,
 * este test falla con mensaje claro.
 *
 * Cross-IA: Mavis main el 2026-07-27.
 * Refs: S38 (R-PKG-016 dptos-export-deudas removido), S103 (front legacy URLs),
 *       S111 (este sprint).
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const FRONT_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const DPTOS_TSX = path.join(FRONT_ROOT, "src/modulos/Dptos/Dptos.tsx");
const VISIT_REASONS_PAGE = path.join(FRONT_ROOT, "src/app/visit-reasons/page.tsx");
const VISIT_REASONS_MODULE = path.join(FRONT_ROOT, "src/modulos/VisitReasons");
const MAIN_MENU_CONFIG = path.join(
  FRONT_ROOT,
  "src/components/MainMenu/mainMenuConfig.ts",
);

describe("S111 — Dptos exportAsync + VisitReasons dead pin", () => {
  it("Dptos.tsx pinea mod.exportAsync = { type: 'dpto-deudas', ... }", () => {
    const src = fs.readFileSync(DPTOS_TSX, "utf8");
    // El slot exportAsync debe estar pineado con el type que matchea
    // DptoDeudasReportType del back.
    expect(src).toMatch(/exportAsync\s*:\s*\{/);
    expect(src).toMatch(/type\s*:\s*['"]dpto-deudas['"]/);
    expect(src).toMatch(/format\s*:\s*['"]excel['"]/);
  });

  it("Dptos.tsx NO contiene la URL legacy /dptos-export-deudas", () => {
    const src = fs.readFileSync(DPTOS_TSX, "utf8");
    // S38 (R-PKG-016) removió el endpoint legacy del back. Si alguien pinea
    // restaurar el execute() a esa URL, este test falla.
    expect(src).not.toMatch(/['"]\/dptos-export-deudas['"]/);
    expect(src).not.toMatch(/dptos-export-deudas/);
  });

  it("Dptos.tsx NO contiene ButtonReportDeudas (componente custom)", () => {
    const src = fs.readFileSync(DPTOS_TSX, "utf8");
    // El botón custom fue reemplazado por el slot exportAsync.
    expect(src).not.toMatch(/ButtonReportDeudas/);
  });

  it("Dptos.tsx NO contiene el onReport legacy function", () => {
    const src = fs.readFileSync(DPTOS_TSX, "utf8");
    expect(src).not.toMatch(/const\s+onReport\s*=/);
  });

  it("Dptos.tsx NO contiene extraButtons: [<ButtonReportDeudas />]", () => {
    const src = fs.readFileSync(DPTOS_TSX, "utf8");
    expect(src).not.toMatch(/extraButtons\s*:\s*\[<ButtonReportDeudas/);
  });

  it("src/app/visit-reasons/page.tsx NO existe (feature dead)", () => {
    // S111 removió la página Next.js que renderizaba VisitReasons.
    // Si alguien la restaura sin reactivar el back, el page tira 404 en runtime.
    expect(fs.existsSync(VISIT_REASONS_PAGE)).toBe(false);
  });

  it("src/modulos/VisitReasons/ NO existe (módulo pineado y borrado)", () => {
    // El módulo fue pineado a NotAccess en S103 y borrado en S111.
    // Si alguien lo restaura, debe seguir los 3 pasos del docstring pineado
    // (back controller + routes/api.php + entry del menú + reemplazar placeholder).
    expect(fs.existsSync(VISIT_REASONS_MODULE)).toBe(false);
  });

  it("mainMenuConfig.ts NO contiene entry visit-reasons en el menú", () => {
    const src = fs.readFileSync(MAIN_MENU_CONFIG, "utf8");
    // S103 fix removió el entry del menú Backoffice. Si alguien lo restaura
    // sin reactivar el back, el link apunta a un page.tsx que no existe.
    expect(src).not.toMatch(/href\s*:\s*['"]\/visit-reasons['"]/);
  });
});
