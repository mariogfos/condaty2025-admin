import { ModCrudType } from "@/mk/hooks/useCrud/useCrud";

/**
 * getBankAccountsMod (S41 — NEW-NEW-43 Bank Accounts async export frontend)
 *
 * Factory que retorna el `mod` literal para el módulo BankAccounts.
 * Extraído de `BankAccounts.tsx` para permitir tests unitarios sin renderizar
 * React (patrón S37.5: `getPaymentsConfig` + S38.5: `getDefaultersMod`).
 *
 * S41 pineá el slot `mod.exportAsync` (S36.5) para migrar el módulo
 * BankAccounts al flow async PDF + XLSX (S32 + S41 backend
 * `BankAccountsReportType`).
 *
 * Pre-S41: el `BankAccounts.tsx` pineaba `export: true` (BC) sin
 * `mod.exportAsync`. El IconExport legacy llamaba a
 * `GET /api/v3/bank-accounts?_export=pdf` (vía `useCrud.onExport`) y
 * el `BankAccountController` renderizaba Dompdf en el request HTTP.
 * Riesgo: listados grandes (>200 cuentas) caían en timeout 60s PHP-FPM.
 *
 * Post-S41: `export: false` (kill legacy) + `exportAsync: {...}` (slot async).
 * El flow async va por `POST /api/v3/reports/bank-accounts/export` con
 * format=pdf|xlsx. Render en queue worker (S32), Dompdf pagination
 * automática.
 *
 * @see HALLAZGO-NEW-57 (binding, cross-project) — módulos sin ReportType usan flow genérico
 * @see D-36.5-3 (S36.5) — si pinean AMBOS `mod.export: true` Y `mod.exportAsync`,
 *   el async override el legacy
 * @see D-37.5-3 (S37.5) — factory pattern para configs `mod` (patrón reusable)
 */
export const getBankAccountsMod = (): ModCrudType => ({
  modulo: "v3/bank-accounts",
  singular: "cuenta bancaria",
  plural: "cuentas bancarias",
  filter: true,
  // S41: kill legacy IconExport (D-38-5 pattern) + slot async pineado.
  // - export: false → kill legacy IconExport.
  // - exportAsync: {...} → slot async que useCrud auto-renderea via
  //   AsyncExportButton (S36.5 pattern, idéntico a defaulters.config S38.5
  //   + payments.config S37.5).
  // - type: "bank-accounts" → matchea el BankAccountsReportType pineado en
  //   S41 backend (ReportTypeRegistry.auto-discovery).
  // - format: "pdf" → ReportGenerator chunked (S32). XLSX también soportado
  //   en el backend (S41 pineá excelRowProvider).
  // - auto-pasa filterBy+searchBy del store actual (useCrud S36.5 D-36.5-2).
  export: false,
  exportAsync: {
    type: "bank-accounts",
    format: "pdf",
    label: "Exportar PDF",
  },
  import: false,
  permiso: "owners",
  extraData: true,
  hideActions: {
    edit: true,
    del: true,
  },
});
