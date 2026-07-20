import { describe, it, expect } from "vitest";
import { getDefaultersMod } from "../defaultersMod";

/**
 * defaultersMod test (S38.5)
 *
 * Verifica que el factory `getDefaultersMod()` retorna el `mod` literal
 * con los slots async pineados correctamente. Patrón idéntico al
 * `payments.config.test.ts` de S37.5 (4 tests, ~5ms sin renderizar React).
 *
 * @see HALLAZGO-NEW-58 (binding, S38) — fix bug pre-existente export array
 * @see D-38-7 — Defaulters.config pinea mod.export: false + mod.exportAsync
 */
describe("Defaulters mod config (S38.5)", () => {
  it("mod.export = false (kill legacy IconExport, HALLAZGO-NEW-58)", () => {
    // Pre-S38.5 pineaba `export: ["pdf", "xls"]` (array, no matchea el type
    // ModCrudType.export?: boolean). IconExport legacy nunca se rendereaba.
    // Post-S38.5: `export: false` (kill legacy) + `exportAsync: {...}` (async).
    const mod = getDefaultersMod();
    expect(mod.export).toBe(false);
  });

  it("mod.exportAsync.type = 'defaulters' (matchea DefaulterReportType S38)", () => {
    // type debe matchear el ReportTypeRegistry pineado en S38 backend.
    // Si cambia el type en backend, hay que actualizar este slot.
    const mod = getDefaultersMod();
    expect(mod.exportAsync?.type).toBe("defaulters");
  });

  it("mod.exportAsync.format = 'pdf' (ReportGenerator S32, S38 backend)", () => {
    // PDF → ReportGenerator chunked (S32 D-32). No XLSX en Defaulter.
    const mod = getDefaultersMod();
    expect(mod.exportAsync?.format).toBe("pdf");
  });

  it("mod.exportAsync.label = 'Exportar PDF'", () => {
    // Label del botón AsyncExportButton.
    const mod = getDefaultersMod();
    expect(mod.exportAsync?.label).toBe("Exportar PDF");
  });
});
