import { describe, it, expect } from "vitest";
import { getOutlaysMod } from "../outlaysMod";

/**
 * outlaysMod test (S43 + S118b)
 *
 * Verifica que el factory `getOutlaysMod()` retorna el `mod` literal
 * con los slots async pineados correctamente. Patrón idéntico al
 * `bankAccountsMod.test.ts` de S41 + `defaultersMod.test.ts` de S38.5
 * + `payments.config.test.ts` de S37.5.
 *
 * S41 discovery (binding, cross-project): `Outlays.tsx` pinea
 * `modulo: "v3/expenses"` + `permiso: "outlays"`. Es un alias del
 * módulo Expenses canónico.
 *
 * S118b: el `type` cambia de "expenses" a "outlays" para matchear el
 * nuevo `OutlaysReportType` del back (que pineá gastos del condominio,
 * tabla `expenses`). El `extraParams.title` pinea "Reporte de Egresos"
 * para que el title del PDF sea consistente con el módulo.
 *
 * @see HALLAZGO-NEW-57 (binding, cross-project) — OutlaysReportType canónico
 * @see D-37.5-3 (S37.5) — factory pattern para configs `mod`
 */
describe("Outlays mod config (S43 + S118b)", () => {
  it("mod.export = false (kill legacy IconExport, S43 D-38-5 pattern)", () => {
    // Pre-S43 pineaba `export: true` (BC) sin `mod.exportAsync`.
    // Post-S43: `export: false` (kill legacy) + `exportAsync: {...}` (async).
    const mod = getOutlaysMod();
    expect(mod.export).toBe(false);
  });

  it("mod.exportAsync.type = 'outlays' (matchea OutlaysReportType S118b)", () => {
    // S118b: type cambió de 'expenses' a 'outlays' para matchear el
    // nuevo `OutlaysReportType` del back (que pineá gastos, NO deudas).
    // El módulo 'Expenses' (deudas) usa type='expenses' (otro ReportType).
    const mod = getOutlaysMod();
    expect(mod.exportAsync?.type).toBe("outlays");
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

  it("mod.exportAsync.extraParams.title = 'Reporte de Egresos' (S118b title dinámico)", () => {
    // S118b: el back lee $report->params['title'] y lo usa como title
    // del PDF. Outlays pinea 'Reporte de Egresos' (consistente con el
    // nombre del módulo "Egresos" del sidebar).
    const mod = getOutlaysMod();
    expect(mod.exportAsync?.extraParams?.title).toBe("Reporte de Egresos");
  });
});
