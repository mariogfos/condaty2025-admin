/**
 * Los enums de un área social — el espejo del lado del front de
 * `app/Modules/Areas/Enums/` del API.
 *
 * 🔴 **Estos valores son un CONTRATO, no una preferencia del front.** Si el API
 * los cambia, acá hay que cambiarlos en el mismo release: los dos repos no se
 * compilan juntos y nada avisa que se separaron. `__tests__/areaEnums.test.ts`
 * fija los números para que al menos un cambio accidental de este lado salga
 * rojo.
 *
 * ## De dónde salen
 *
 * Hasta el 2026-08-14 estas once columnas eran booleanos `tinyint(1)` —y
 * `booking_mode`, un `enum('hour','day')` de MySQL—. Pasaron a enum numérico
 * desde 1 por la regla del proyecto: un booleano es un enum de dos casos que no
 * puede crecer, y cuando aparece el tercero hay código comparando contra `true`
 * en cuatro repos.
 *
 * ⚠️ Ojo con la dirección de `is_free`: la columna se llama "es gratis" pero el
 * enum se llama `AreaPricing`, y **1 es CON COSTO**. Leer `is_free === 1` como
 * "es gratis" da exactamente lo contrario. Por eso está `esGratis()`.
 */

/** `areas.is_free` — si el área se cobra. */
export enum AreaPricing {
  PAID = 1,
  FREE = 2,
}

/** `areas.requires_approval` — si una reserva necesita que alguien la apruebe. */
export enum AreaApproval {
  AUTOMATIC = 1,
  REQUIRED = 2,
}

/** `areas.booking_mode` — la unidad en que se reserva. */
export enum AreaBookingMode {
  HOUR = 1,
  DAY = 2,
}

/** `areas.penalty_or_debt_restriction` — si la deuda o la multa impiden reservar. */
export enum AreaDebtRestriction {
  NONE = 1,
  BLOCKS = 2,
}

/** `areas.auto_approval_available` */
export enum AreaAutoApproval {
  DISABLED = 1,
  ENABLED = 2,
}

/** `areas.cancellable` */
export enum AreaCancellation {
  NOT_ALLOWED = 1,
  ALLOWED = 2,
}

/** `areas.late_cancellation_penalty` */
export enum AreaLateCancellationPenalty {
  NONE = 1,
  APPLIES = 2,
}

/** `areas.enable_survey` */
export enum AreaSurvey {
  DISABLED = 1,
  ENABLED = 2,
}

/** `areas.show_in_calendar` */
export enum AreaCalendarVisibility {
  HIDDEN = 1,
  VISIBLE = 2,
}

/** `areas.show_real_time_availability` */
export enum AreaRealTimeAvailability {
  HIDDEN = 1,
  VISIBLE = 2,
}

/**
 * `areas.requires_membership` — si el área sólo la ven los socios.
 *
 * ⚠️ El API tiene la columna pero **no el código que la aplica**: el servicio
 * que filtra por membresía vive sólo en la rama `prodnew`. Acá está declarada
 * para que cuando ese código llegue a `dev` no haya que migrarla otra vez.
 */
export enum AreaMembership {
  OPEN = 1,
  REQUIRED = 2,
}

/**
 * `areas.status`.
 *
 * `ARCHIVED` es nuevo (2026-08-14): un área dada de baja que conserva su
 * historial de reservas. Reemplaza al borrado físico, que dejaba las reservas
 * apuntando a la nada.
 */
export enum AreaStatus {
  ACTIVE = 1,
  MAINTENANCE = 2,
  ARCHIVED = 3,
}

// ────────────────────────────────────────────────────────────────────
// Lecturas con nombre
//
// Existen para que no haya veinte `=== AreaPricing.FREE` sueltos: una
// comparación repetida es la forma en que un enum termina usado como si fuera
// un booleano, y con `is_free` además se lee al revés de lo que dice el nombre
// de la columna.
// ────────────────────────────────────────────────────────────────────

export const esGratis = (valor: AreaPricing | number | null | undefined): boolean =>
  valor === AreaPricing.FREE;

export const requiereAprobacion = (valor: AreaApproval | number | null | undefined): boolean =>
  valor === AreaApproval.REQUIRED;

export const esPorDia = (valor: AreaBookingMode | number | null | undefined): boolean =>
  valor === AreaBookingMode.DAY;

export const esPorHora = (valor: AreaBookingMode | number | null | undefined): boolean =>
  valor === AreaBookingMode.HOUR;

export const bloqueaConDeuda = (
  valor: AreaDebtRestriction | number | null | undefined,
): boolean => valor === AreaDebtRestriction.BLOCKS;

export const AREA_STATUS_LABEL: Record<AreaStatus, string> = {
  [AreaStatus.ACTIVE]: "Activa",
  [AreaStatus.MAINTENANCE]: "En mantenimiento",
  [AreaStatus.ARCHIVED]: "Dada de baja",
};

export const AREA_BOOKING_MODE_LABEL: Record<AreaBookingMode, string> = {
  [AreaBookingMode.HOUR]: "Por hora",
  [AreaBookingMode.DAY]: "Por día",
};
