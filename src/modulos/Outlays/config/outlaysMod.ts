import { ModCrudType } from "@/mk/hooks/useCrud/useCrud";

/**
 * getOutlaysMod (S43 — NEW-NEW-43 Expenses async export frontend)
 *               (S118b — split Outlays vs Expenses, title dinámico)
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
 * S118b: el `type` cambia de "expenses" a "outlays" para matchear el
 * nuevo `OutlaysReportType` del back (que pineá gastos del condominio,
 * tabla `expenses`). El `extraParams.title` pinea "Reporte de Egresos"
 * para que el title del PDF sea consistente con el módulo.
 *
 * Pre-S43: el `Outlays.tsx` pineaba `export: true` (BC) sin
 * `mod.exportAsync`. El IconExport legacy llamaba a
 * `GET /api/v3/expenses?_export=pdf` (vía `useCrud.onExport`) y
 * el `ExpenseController` renderizaba Dompdf en el request HTTP.
 * Riesgo: listados grandes (>500 egresos) caían en timeout 60s PHP-FPM.
 *
 * Post-S43: `export: false` (kill legacy) + `exportAsync: {...}` (slot async).
 * El flow async va por `POST /api/v3/reports/outlays/export` con
 * format=pdf|xlsx. Render en queue worker (S32), Dompdf pagination
 * automática.
 *
 * @see HALLAZGO-NEW-57 (binding, cross-project) — OutlaysReportType canónico
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
  // S118b: type: "outlays" → matchea el nuevo OutlaysReportType del back.
  //        extraParams.title: "Reporte de Egresos" → title dinámico del PDF.
  // - export: false → kill legacy IconExport.
  // - exportAsync: {...} → slot async que useCrud auto-renderea via
  //   AsyncExportButton (S36.5 pattern, idéntico a defaultersMod S38.5
  //   + payments.config S37.5 + bankAccountsMod S41).
  // - type: "outlays" → matchea el OutlaysReportType pineado en
  //   S118b backend (ReportTypeRegistry.auto-discovery).
  // - format: "pdf" → ReportGenerator chunked (S32). XLSX también soportado
  //   en el backend (S43 pineá excelRowProvider).
  // - extraParams.title: "Reporte de Egresos" → title del PDF (S118b).
  // - auto-pasa filterBy+searchBy del store actual (useCrud S36.5 D-36.5-2,
  //   merge con extraParams desde S118b).
  export: false,
  exportAsync: {
    type: "outlays",
    format: "pdf",
    label: "Exportar",
    supportedFormats: ["pdf", "xlsx", "csv"],
    // Fase 6 (2026-08-04): con `endpoint` el export sale por la LISTA
    // (`GET /v3/expenses?_export={format}`), que es el flow del motor
    // declarativo — el job re-ejecuta el ExpenseController y exporta
    // exactamente lo que el usuario tiene en pantalla, con sus filtros.
    //
    // 🔴 Sin `endpoint` el hook cae al flow por type
    // (`POST /v3/reports/outlays/export`), que resuelve contra el registry
    // legacy y renderiza con Dompdf. Ese camino ya no existe: el
    // OutlaysReportType se borró junto con esta migración.
    endpoint: "/v3/expenses", // sin `/api/`: API_BASE_URL ya lo trae.
    extraParams: { title: "Reporte de Egresos" },
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
