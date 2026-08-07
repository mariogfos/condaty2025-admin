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
  // Motor nuevo (Fase 6, 2026-08-07): `endpoint` + `supportedFormats` viajan
  // juntos — `useCrud` elige el botón mirando `supportedFormats`, y el botón
  // viejo no recibe `endpoint`. El pedido va por
  // `GET /v3/defaulters?_export={formato}` y lo atiende `MorososExportConfig`.
  //
  // 🔴 El reporte viejo imprimía CUATRO columnas —Unidad, Titular, Expensas
  // atrasadas y Total— mientras la pantalla muestra siete: calculaba Expensas,
  // Multas y Mant. Valor y las tiraba antes de imprimir.
  export: false,
  exportAsync: {
    type: "defaulters",
    format: "pdf",
    label: "Exportar",
    supportedFormats: ["pdf", "xlsx", "csv"],
    endpoint: "/v3/defaulters",
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
