import { ModCrudType } from "@/mk/hooks/useCrud/useCrud";

/**
 * Config del módulo Entidades Bancarias (2026-08-05).
 *
 * ⚠️ Este módulo nació al revés que los demás: el REPORTE existía desde S59 y
 * la pantalla no. `BankEntityReportType` renderizaba un listado que **ningún
 * botón de la app podía pedir** — el único rastro de `bank-entities` en el
 * front era la etiqueta del filtro del historial de descargas. Migrando Bancos
 * a Fase 6 quedó a la vista, y Mario decidió que va el módulo.
 *
 * 🔴 **`bank_entities` es un catálogo COMPARTIDO entre todos los condominios**:
 * la tabla no tiene `client_id` ni `ClientTrait`. Editar una entidad acá la
 * cambia para TODOS los clientes, así que la pantalla vive en Backoffice y no
 * en Finanzas —donde está Cuentas Bancarias, que sí es por condominio—.
 *
 * Usa `perm: "superadmins"`, el mismo patrón que `/app-versions`, en vez de
 * inventar una ability nueva: agregar una fila a `abilities` obliga a tocar los
 * seeders y a repartirla en los roles ya existentes en producción.
 */
export const getBankEntitiesMod = (): ModCrudType => ({
  modulo: "v3/bank-entities",
  singular: "entidad bancaria",
  plural: "entidades bancarias",
  filter: true,
  permiso: "superadmins",
  // 🔴 `endpoint` y `supportedFormats` son UNA sola cosa: `useCrud` elige qué
  // botón renderiza mirando `supportedFormats`, y el botón viejo no recibe
  // `endpoint`. Poner uno solo deja el export yendose por el motor viejo sin
  // ninguna diferencia visible.
  export: false,
  exportAsync: {
    type: "bank-entities",
    format: "pdf",
    label: "Exportar",
    supportedFormats: ["pdf", "xlsx", "csv"],
    endpoint: "/v3/bank-entities", // sin `/api/`: el baseURL ya lo trae.
  },
  import: false,
  extraData: false,
});
