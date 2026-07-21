import { describe, it, expect } from "vitest";
import { getBankAccountsMod } from "../bankAccountsMod";

/**
 * bankAccountsMod test (S41)
 *
 * Verifica que el factory `getBankAccountsMod()` retorna el `mod` literal
 * con los slots async pineados correctamente. Patrón idéntico al
 * `defaultersMod.test.ts` de S38.5 + `payments.config.test.ts` de S37.5
 * (4 tests, ~5ms sin renderizar React).
 *
 * @see HALLAZGO-NEW-57 (binding, cross-project) — BankAccounts ahora tiene
 *      ReportType canónico (S41 backend)
 * @see D-37.5-3 (S37.5) — factory pattern para configs `mod`
 */
describe("BankAccounts mod config (S41)", () => {
  it("mod.export = false (kill legacy IconExport, S41 D-38-5 pattern)", () => {
    // Pre-S41 pineaba `export: true` (BC) sin `mod.exportAsync`.
    // Post-S41: `export: false` (kill legacy) + `exportAsync: {...}` (async).
    const mod = getBankAccountsMod();
    expect(mod.export).toBe(false);
  });

  it("mod.exportAsync.type = 'bank-accounts' (matchea BankAccountsReportType S41)", () => {
    // type debe matchear el ReportTypeRegistry pineado en S41 backend.
    // Si cambia el type en backend, hay que actualizar este slot.
    const mod = getBankAccountsMod();
    expect(mod.exportAsync?.type).toBe("bank-accounts");
  });

  it("mod.exportAsync.format = 'pdf' (ReportGenerator S32, S41 backend)", () => {
    // PDF → ReportGenerator chunked (S32 D-32). XLSX también soportado
    // (S41 pineá excelRowProvider) pero default es PDF.
    const mod = getBankAccountsMod();
    expect(mod.exportAsync?.format).toBe("pdf");
  });

  it("mod.exportAsync.label = 'Exportar PDF'", () => {
    // Label del botón AsyncExportButton.
    const mod = getBankAccountsMod();
    expect(mod.exportAsync?.label).toBe("Exportar PDF");
  });
});
