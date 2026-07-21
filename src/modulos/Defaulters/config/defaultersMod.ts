import { ModCrudType } from "@/mk/hooks/useCrud/useCrud";

/**
 * Type que extiende ModCrudType con el slot opcional `onSearch`.
 *
 * El mod de Defaulters pineá `onSearch` como callback custom (closure
 * definida en el componente, no en el factory). El type base de
 * `ModCrudType` no tiene ese slot — es una extensión específica de
 * este módulo (S38.5).
 *
 * Si en el futuro S38+ generaliza `onSearch` en `ModCrudType`, este type
 * se puede colapsar.
 */
export type DefaultersModType = ModCrudType & {
  onSearch?: (items: any[], search: any) => any[];
};

/**
 * getDefaultersMod (S38.5 — NEW-NEW-43 Defaulter async export frontend)
 *
 * Factory que retorna el `mod` literal para el módulo Defaulters (Morosos).
 * Extraído de `Defaulters.tsx` para permitir tests unitarios sin renderizar
 * React (patrón S37.5: `getPaymentsConfig`).
 *
 * S38.5 pineá el slot `mod.exportAsync` (S36.5) para migrar el módulo
 * Defaulters al flow async PDF (S32 + S38 backend `DefaulterReportType`).
 *
 * HALLAZGO-NEW-58: el `Defaulters.tsx` pre-S38.5 pineá `export: ["pdf", "xls"]`
 * (formato array) en el mod, que NO matchea el type `ModCrudType.export?: boolean`.
 * El IconExport legacy de `useCrud` no se rendereaba (bug pre-existente). El
 * export de Defaulters estaba ROTO en producción. S38.5 lo fixea pineando
 * `export: false` (kill legacy) + `exportAsync: {...}` (slot async).
 *
 * @see HALLAZGO-NEW-58 (binding, S38) — bug pre-existente de DefaultersView orphaned.
 *      Archivo `components/DefaultersView/DefaultersView.tsx` BORRADO en S40
 *      (HALLAZGO-NEW-58 follow-up). 0 imports confirmados pre-S40.
 * @see HALLAZGO-NEW-57 (binding, cross-project) — módulos sin ReportType usan flow genérico
 * @see D-36.5-3 (S36.5) — si pinean AMBOS `mod.export: true` Y `mod.exportAsync`,
 *   el async override el legacy
 */
export const getDefaultersMod = (): DefaultersModType => ({
  modulo: "v3/defaulters",
  singular: "Moroso",
  plural: "Morosos",
  permiso: "defaulters",
  pagination: false,
  extraData: true,
  // S38.5 (HALLAZGO-NEW-58): el pre-S38 pineá `export: ["pdf", "xls"]`
  // (array) que NO matchea el type ModCrudType.export?: boolean.
  // - export: false → kill legacy IconExport.
  // - exportAsync: {...} → slot async que useCrud auto-renderea via
  //   AsyncExportButton (S36.5 pattern, idéntico a payments.config S37.5).
  // - format: "pdf" → matchea el DefaulterReportType pineado en S38 backend
  //   (ReportTypeRegistry.auto-discovery).
  // - auto-pasa filterBy+searchBy del store actual (useCrud S36.5 D-36.5-2).
  export: false,
  exportAsync: {
    type: "defaulters",
    format: "pdf",
    label: "Exportar PDF",
  },
  hideActions: {
    view: true,
    add: true,
    edit: true,
    del: true,
  },
  filter: true,
  saveMsg: {
    add: "Moroso creado con éxito",
    edit: "Moroso actualizado con éxito",
    del: "Moroso eliminado con éxito",
  },
});
