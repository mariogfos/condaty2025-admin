import { ModCrudType } from "@/mk/hooks/useCrud/useCrud";

/**
 * getOutlaysMod (S43 — NEW-NEW-43 Expenses async export frontend)
 *
 * Factory que retorna el `mod` literal para el módulo Outlays (Egresos).
 * Extraído de `Outlays.tsx` para permitir tests unitarios sin renderizar
 * React (patrón S37.5: `getPaymentsConfig` + S38.5: `getDefaultersMod` +
 * S41: `getBankAccountsMod`).
 *
 * S43 pineá el slot `mod.exportAsync` (S36.5) para migrar el módulo
 * Outlays al flow async PDF + XLSX (S32 + S43 backend
 * `ExpensesReportType`).
 *
 * S41 discovery (binding, cross-project): `Outlays.tsx` pinea
 * `modulo: "v3/expenses"` + `permiso: "outlays"`. Es un alias del
 * módulo Expenses canónico. Cuando se pineá `mod.exportAsync: { type:
 * "expenses" }` aquí, el `ExpensesReportType` (S43) sirve para ambos.
 * El permiso `outlays` se chequea a nivel del job (GenerateReportJob
 * → controller), no del ReportType.
 *
 * Pre-S43: el `Outlays.tsx` pineaba `export: true` (BC) sin
 * `mod.exportAsync`. El IconExport legacy llamaba a
 * `GET /api/v3/expenses?_export=pdf` (vía `useCrud.onExport`) y
 * el `ExpenseController` renderizaba Dompdf en el request HTTP.
 * Riesgo: listados grandes (>500 egresos) caían en timeout 60s PHP-FPM.
 *
 * Post-S43: `export: false` (kill legacy) + `exportAsync: {...}` (slot async).
 * El flow async va por `POST /api/v3/reports/expenses/export` con
 * format=pdf|xlsx. Render en queue worker (S32), Dompdf pagination
 * automática.
 *
 * @see HALLAZGO-NEW-57 (binding, cross-project) — ExpensesReportType canónico
 * @see D-36.5-3 (S36.5) — si pinean AMBOS `mod.export: true` Y `mod.exportAsync`,
 *   el async override el legacy
 * @see D-37.5-3 (S37.5) — factory pattern para configs `mod` (patrón reusable)
 * @see S41 (Outlays discovery) — modulo: "v3/expenses" + permiso: "outlays"
 *   es alias del módulo Expenses canónico
 */
export const getOutlaysMod = (): ModCrudType => ({
  modulo: "v3/expenses",
  singular: "Egreso",
  plural: "Egresos",
  filter: true,
  // S43: kill legacy IconExport (D-38-5 pattern) + slot async pineado.
  // - export: false → kill legacy IconExport.
  // - exportAsync: {...} → slot async que useCrud auto-renderea via
  //   AsyncExportButton (S36.5 pattern, idéntico a defaultersMod S38.5
  //   + payments.config S37.5 + bankAccountsMod S41).
  // - type: "expenses" → matchea el ExpensesReportType pineado en
  //   S43 backend (ReportTypeRegistry.auto-discovery).
  // - format: "pdf" → ReportGenerator chunked (S32). XLSX también soportado
  //   en el backend (S43 pineá excelRowProvider).
  // - auto-pasa filterBy+searchBy del store actual (useCrud S36.5 D-36.5-2).
  export: false,
  exportAsync: {
    type: "expenses",
    format: "pdf",
    label: "Exportar PDF",
  },
  permiso: "outlays",
  extraData: true,
  hideActions: {
    edit: true,
    del: true,
  },
  loadView: { fullType: "DET" },
  saveMsg: {
    add: "Egreso creado con éxito",
    edit: "Egreso actualizado con éxito",
    del: "Egreso anulado con éxito",
  },
});
