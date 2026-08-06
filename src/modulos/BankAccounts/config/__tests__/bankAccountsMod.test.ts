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

  it("el label ya no promete un solo formato", () => {
    // Fase 6: el botón ofrece los tres formatos en un menú, así que decir
    // "Exportar PDF" pasó a ser mentira.
    const mod = getBankAccountsMod();
    expect(mod.exportAsync?.label).toBe("Exportar");
  });

  /**
   * 🔴 `endpoint` y `supportedFormats` son UNA sola cosa, y es el interruptor
   * silencioso de toda la migración.
   *
   * `useCrud` elige QUÉ botón renderiza mirando `supportedFormats`, y el botón
   * viejo NO recibe `endpoint`. Si queda sólo el endpoint, en pantalla se ve el
   * botón legacy —que lo ignora— y el export se sigue yendo por el motor viejo,
   * sin ninguna diferencia visible. Ya pasó al migrar Egresos.
   */
  it("el export entra por el motor nuevo: endpoint y supportedFormats juntos", () => {
    const mod = getBankAccountsMod();

    expect(mod.exportAsync?.supportedFormats).toEqual(["pdf", "xlsx", "csv"]);
    expect(mod.exportAsync?.endpoint).toBe("/v3/bank-accounts");
  });

  /**
   * Sin `/api/` al principio: el `baseURL` de axios ya termina en `/api`, así
   * que un path con el prefijo da `.../api/api/...` → 404.
   */
  it("el endpoint no repite el prefijo /api", () => {
    expect(getBankAccountsMod().exportAsync?.endpoint).not.toMatch(/^\/api\//);
  });
});
