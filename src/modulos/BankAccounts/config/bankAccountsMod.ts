import { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import RenderForm from "../RenderForm/RenderForm";
import RenderView from "../RenderView/RenderView";

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
 *
 * 🔴 La mudanza a esta factory (c474af8b) se llevó `renderForm` y `renderView`
 * y nada avisó —no hay tipo que las exija—. Vivieron perdidas del 2026-07-21
 * al 2026-09-30: el alta caía al formulario genérico de `useCrud`, que no pide
 * titular, CI/NIT, número, tipo ni imagen, y la configuración del QR dinámico
 * por cuenta (`QrAccountConfig`, admin#822) quedó sin pantalla que la montara.
 * Estas dos claves son la interfaz del módulo: las pinea
 * `__tests__/bankAccountsMod.test.ts`. Misma pérdida que Egresos (CDT-37/39).
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
  // Fase 6 (2026-08-05): Bancos migró al motor declarativo.
  //
  // 🔴 `endpoint` y `supportedFormats` son UNA sola cosa, no dos opciones. El
  // `useCrud` elige QUÉ botón renderiza mirando `supportedFormats`, y el botón
  // viejo no recibe `endpoint`: poner sólo el endpoint deja el botón legacy en
  // pantalla —que lo ignora— y el export se sigue yendo por el motor viejo,
  // sin ninguna diferencia visible.
  exportAsync: {
    type: "bank-accounts",
    format: "pdf",
    label: "Exportar",
    supportedFormats: ["pdf", "xlsx", "csv"],
    endpoint: "/v3/bank-accounts", // sin `/api/`: el baseURL ya lo trae.
  },
  import: false,
  // 🔴 `bank_accounts`, la habilidad del catálogo y la del menú
  // (`mainMenuConfig.ts`). Acá decía `owners`, así que los botones de alta,
  // edición y borrado los abría la habilidad de RESIDENTES. El API pide
  // `bank_accounts:C/U/D` desde el 2026-09-29 (`habilidad:` en la ruta).
  // Medido ese día en la copia de producción: nadie con `bank_accounts:C/U/D`
  // carece de `owners:C/U/D`, y los 3 vínculos al revés (dos condominios de
  // prueba) no tienen `bank_accounts:R`, así que el menú no les muestra la
  // pantalla.
  permiso: "bank_accounts",
  extraData: true,
  // El alta. La edición NO entra por la acción de la fila (oculta abajo): se
  // abre desde el detalle, con «Editar datos», sobre la cuenta ya leída con
  // `fullType=DET` —que trae `isInUse`, lo que congela banco, número y titular.
  renderForm: RenderForm,
  // El detalle: habilitar/deshabilitar y el botón de edición. Es el único
  // camino a la sección del QR dinámico de la cuenta.
  renderView: RenderView,
  hideActions: {
    edit: true,
    del: true,
  },
});
