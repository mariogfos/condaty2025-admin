/**
 * La matriz de permisos operativos: 6 vínculos x 4 acciones.
 *
 * Los ids SON las claves del JSON `operational_permissions_config` y de las
 * cuatro columnas legacy. No se traducen.
 */
export const operationalActionOptions = [
  { id: "invitation", name: "QR" },
  { id: "visit_approval", name: "Visitas" },
  { id: "reservation", name: "Reservas" },
  { id: "alert", name: "Alertas" },
] as const;

export const operationalRoleOptions = [
  {
    id: "homeowner_resident",
    name: "Propietario residente",
    description: "Propietario que también vive en la unidad.",
  },
  {
    id: "homeowner_resident_dependent",
    name: "Dep. prop. residente",
    description: "Dependiente de propietario residente.",
  },
  {
    id: "homeowner_non_resident",
    name: "Propietario no residente",
    description: "Propietario que no vive en la unidad.",
  },
  {
    id: "homeowner_non_resident_dependent",
    name: "Dep. prop. no residente",
    description: "Dependiente de propietario no residente.",
  },
  { id: "tenant", name: "Inquilino", description: "Residente asignado como inquilino." },
  {
    id: "tenant_dependent",
    name: "Dep. inquilino",
    description: "Dependiente de inquilino.",
  },
] as const;

export type OperationalAction = (typeof operationalActionOptions)[number]["id"];
export type OperationalRole = (typeof operationalRoleOptions)[number]["id"];
export type OperationalPermissionsConfig = Record<
  OperationalRole,
  Record<OperationalAction, boolean>
>;

const legacyOperationalActionFieldNames: Record<OperationalAction, string> = {
  invitation: "owner_can_invite_without_residence",
  visit_approval: "owner_can_approve_visits_without_residence",
  reservation: "owner_can_reserve_without_residence",
  alert: "owner_can_alert_without_residence",
};

/**
 * Las cuatro columnas `owner_can_*_without_residence` son ENUMS NUMÉRICOS
 * desde 1: 1 = DENIED, 2 = GRANTED.
 *
 * 🔴 La versión de producción de esta pantalla las lee con
 * `Number(value) === 1`, que con esta numeración es exactamente el caso
 * DENEGADO. Copiarla habría mostrado habilitado justo lo que el condominio
 * niega — el mismo `is_main == 1` que ya mordió en el formulario de pagos.
 *
 * Se aceptan `true` y `"Y"` porque una respuesta vieja del API todavía puede
 * traerlos, pero el 1 pelado ya no significa "sí".
 */
const OWNER_PERMISSION_GRANTED = 2;

export const isPermisoOtorgado = (value: unknown) =>
  Number(value) === OWNER_PERMISSION_GRANTED || value === true || value === "Y";

/**
 * Los defaults: quien reside puede todo; quien no reside, lo que digan sus
 * cuatro columnas. Un condominio sin configuración le niega al no residente —
 * un permiso falla cerrado, igual que en el API.
 */
export const buildDefaultOperationalPermissionsConfig = (
  client_config: Record<string, any> = {},
): OperationalPermissionsConfig => {
  const residentDefaults = operationalActionOptions.reduce(
    (acc, action) => ({ ...acc, [action.id]: true }),
    {} as Record<OperationalAction, boolean>,
  );
  const nonResidentOwnerDefaults = operationalActionOptions.reduce(
    (acc, action) => ({
      ...acc,
      [action.id]: isPermisoOtorgado(
        client_config?.[legacyOperationalActionFieldNames[action.id]],
      ),
    }),
    {} as Record<OperationalAction, boolean>,
  );

  return {
    homeowner_resident: { ...residentDefaults },
    homeowner_resident_dependent: { ...residentDefaults },
    homeowner_non_resident: { ...nonResidentOwnerDefaults },
    homeowner_non_resident_dependent: { ...nonResidentOwnerDefaults },
    tenant: { ...residentDefaults },
    tenant_dependent: { ...residentDefaults },
  };
};

/**
 * El JSON guardado sobre los defaults, clave por clave.
 *
 * ⚠️ Sólo pisa lo que el JSON NOMBRA. Si la ausencia contara como `false`, un
 * condominio con la matriz guardada a medias apagaría permisos que nadie tocó.
 */
export const normalizeOperationalPermissionsConfig = (
  value: any,
  client_config: Record<string, any> = {},
): OperationalPermissionsConfig => {
  const parsed =
    typeof value === "string"
      ? (() => {
          try {
            return JSON.parse(value);
          } catch {
            return {};
          }
        })()
      : value || {};
  const config = buildDefaultOperationalPermissionsConfig(client_config);

  operationalRoleOptions.forEach((role) => {
    operationalActionOptions.forEach((action) => {
      if (
        Object.prototype.hasOwnProperty.call(parsed?.[role.id] || {}, action.id)
      ) {
        config[role.id][action.id] = Boolean(parsed[role.id][action.id]);
      }
    });
  });

  return config;
};
