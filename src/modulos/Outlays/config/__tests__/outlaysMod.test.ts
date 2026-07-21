import { describe, it, expect } from "vitest";
import { getOutlaysMod } from "../outlaysMod";

/**
 * outlaysMod test (S43)
 *
 * Verifica que el factory `getOutlaysMod()` retorna el `mod` literal
 * con los slots async pineados correctamente. Patrón idéntico al
 * `bankAccountsMod.test.ts` de S41 + `defaultersMod.test.ts` de S38.5
 * + `payments.config.test.ts` de S37.5 (4 tests, ~5ms sin renderizar
 * React).
 *
 * S41 discovery (binding, cross-project): `Outlays.tsx` pinea
 * `modulo: "v3/expenses"` + `permiso: "outlays"`. Es un alias del
 * módulo Expenses canónico. El type `"expenses"` matchea el
 * `ExpensesReportType` pineado en S43 backend.
 *
 * @see HALLAZGO-NEW-57 (binding, cross-project) — ExpensesReportType canónico
 * @see D-37.5-3 (S37.5) — factory pattern para configs `mod`
 */
describe("Outlays mod config (S43)", () => {
  it("mod.export = false (kill legacy IconExport, S43 D-38-5 pattern)", () => {
    // Pre-S43 pineaba `export: true` (BC) sin `mod.exportAsync`.
    // Post-S43: `export: false` (kill legacy) + `exportAsync: {...}` (async).
    const mod = getOutlaysMod();
    expect(mod.export).toBe(false);
  });

  it("mod.exportAsync.type = 'expenses' (matchea ExpensesReportType S43)", () => {
    // type debe matchear el ReportTypeRegistry pineado en S43 backend.
    // Outlays pineá modulo: 'v3/expenses' (alias) pero el type del slot
    // async es 'expenses' (canónico).
    const mod = getOutlaysMod();
    expect(mod.exportAsync?.type).toBe("expenses");
  });

  it("mod.exportAsync.format = 'pdf' (ReportGenerator S32, S43 backend)", () => {
    // PDF → ReportGenerator chunked (S32 D-32). XLSX también soportado
    // (S43 pineá excelRowProvider) pero default es PDF.
    const mod = getOutlaysMod();
    expect(mod.exportAsync?.format).toBe("pdf");
  });

  it("mod.exportAsync.label = 'Exportar PDF'", () => {
    // Label del botón AsyncExportButton.
    const mod = getOutlaysMod();
    expect(mod.exportAsync?.label).toBe("Exportar PDF");
  });
});
