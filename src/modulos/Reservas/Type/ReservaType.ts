/**
 * Los tipos y los enums del módulo Reservas.
 *
 * Es la SSoT del front para el dominio reserva: los dos enums numéricos y la
 * forma de lo que devuelve el API. Antes vivían partidos en
 * `constants/reservationConstants.ts` (el enum de estado) y `types.ts` (las
 * formas), más una tercera copia de la fila del detalle escrita a mano dentro
 * de `RenderView.tsx`.
 *
 * ⚠️ Los labels, colores y opciones de filtro NO van acá: van en
 * `config/reservas.constants.ts`. Acá sólo el dominio.
 */

/**
 * Estado de una reserva — enum numérico canónico.
 *
 * Espeja `App\Modules\Reservations\Enums\ReservationStatus` del API, que es
 * `enum ReservationStatus: int`. La columna `reservations.status` es TINYINT
 * desde 2026-06-29 y el motor Mk2 serializa el modelo con su cast de enum,
 * así que el número viaja tal cual (no existe un Resource en el camino).
 *
 * 🔴 Los comentarios `// W`, `// A`, … son los chars LEGACY, de antes del flip.
 * Están sólo para poder rastrear código viejo; **ningún char se manda ni se
 * compara**. Si aparece uno en una comparación, es un bug.
 */
export enum ReservationStatus {
  AWAITING_APPROVAL = 1, // W: Esperando confirmación
  PENDING_PAYMENT = 2, // A: Pago pendiente
  PAYMENT_SUBMITTED = 3, // Q: Por confirmar pago
  RESERVED_UNPAID = 4, // N: Reservado (sin pago)
  RESERVED_PAID = 5, // L: Reservado (pagado)
  REJECTED = 6, // R: Reserva rechazada
  CANCELLED_MANUAL = 7, // C: Cancelada manualmente
  CANCELLED_AUTO = 8, // T: Cancelada automática
  COMPLETED = 9, // F: Finalizada
  MAINTENANCE = 10, // M: Mantenimiento
  LEGACY_REJECTED = 11, // X: Rechazada (legacy)
}

/**
 * El flujo de aprobación de una reserva — enum numérico.
 *
 * Espeja `App\Modules\Reservations\Enums\ReservationApproval` del API.
 *
 * 🔴 Este enum FALTABA en el front, y ésa es la razón exacta del segundo bug:
 * los botones Aprobar y Rechazar del detalle mandaban `is_approved: "Y"` y
 * `is_approved: "N"` —los chars de antes del flip de junio de 2026—. La
 * columna es TINYINT y `ReservationUpdateRequest` valida `integer` +
 * `Rule::in([1,2,3])`, así que el char responde 422 y la reserva no se aprueba
 * ni se rechaza nunca.
 *
 * `PENDING` no lo manda el admin: es el valor inicial que escribe el alta.
 */
export enum ReservationApproval {
  PENDING = 1, // en espera (valor inicial, pre-decisión)
  APPROVED = 2, // aprobada
  REJECTED = 3, // rechazada
}

export type ReservationResidentDependent = {
  id?: number | string;
  owner_id?: number | string;
  owner?: ReservationResident | null;
};

export type ReservationResident = {
  id?: number | string;
  name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  mother_last_name?: string | null;
  url_avatar?: string | null;
  email?: string | null;
  dependientes?: ReservationResidentDependent[] | null;
};

export type ReservationUnit = {
  id: number | string;
  nro?: string | null;
  description?: string | null;
  type_id?: number | string | null;
  type?: {
    id?: number | string;
    name?: string | null;
    description?: string | null;
  } | null;
  defaulter?: string | null;
  homeowner?: ReservationResident | null;
  tenant?: ReservationResident | null;
  titular?: {
    id?: number | string;
    owner_id?: number | string;
    owner?: ReservationResident | null;
  } | null;
};

export type ReservationArea = {
  id: number | string;
  title?: string | null;
  description?: string | null;
  max_capacity?: number | null;
  available_days?: string[] | null;
  available_hours?: Record<string, string[]> | null;
  price?: string | number | null;
  /**
   * 🔴 Las banderas del área son ENUMS NUMÉRICOS, no booleanos ni strings.
   *
   * Este tipo las declaraba como `boolean` y `string`, y por eso `tsc` no veía
   * las comparaciones contra `"hour"` y `=== true` del módulo Calendar: eran
   * string contra string, y booleano contra booleano. Al corregir el tipo, el
   * compilador señaló los diez sitios de una.
   *
   * Los valores viven en `@/modulos/Areas/Type/AreaEnums`.
   */
  is_free?: number | null;
  booking_mode?: number | null;
  max_reservations_per_day?: number | null;
  max_booking_duration?: number | null;
  usage_rules?: string | null;
  special_restrictions?: string | null;
  cancellation_policy?: string | null;
  penalty_or_debt_restriction?: number | null;
  requires_approval?: number | null;
  show_real_time_availability?: number | null;
  show_in_calendar?: number | null;
  images?: string[] | null;
};

/** Un tramo horario de la reserva (`reservation_periods`). */
export type ReservationPeriod = {
  time_from?: string | null;
  time_to?: string | null;
};

/**
 * La deuda asociada a la reserva, con el pago ya resuelto cuando el API lo
 * pudo resolver.
 *
 * ⚠️ `status` y los `*_status` son dominio DEUDA/PAGO, no reserva: siguen
 * llegando como string en algunos caminos. Ver `utils/reservationStatus.ts`.
 */
export type ReservationDebtDpto = {
  id?: number | string | null;
  payment_id?: number | string | null;
  resolved_payment_id?: number | string | null;
  resolved_payment_status?: string | null;
  status?: string | null;
  payment?: {
    status?: string | null;
  } | null;
};

/**
 * Una fila del listado (`fullType=L`).
 *
 * ⚠️ `status` admite `string` porque el listado se pinta con datos que pueden
 * venir de un `localStorage` viejo o de un mock; el front lo normaliza con
 * `Number()` antes de comparar (ver `resolveReservationDisplayStatus`). Lo que
 * NUNCA se hace es compararlo contra un char.
 */
export type ReservationListItem = {
  id: number | string;
  area_id?: number | string | null;
  owner_id?: number | string | null;
  dpto_id?: number | string | null;
  debt_dpto_id?: number | string | null;
  status?: ReservationStatus | number | string;
  amount?: string | number | null;
  obs?: string | null;
  reason?: string | null;
  created_at?: string | null;
  date_at?: string | null;
  date_end?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  people_count?: number | null;
  time_limit?: string | null;
  payment_id?: number | string | null;
  resolved_payment_id?: number | string | null;
  resolved_payment_status?: string | null;
  payment_status?: string | null;
  debt_status?: string | null;
  payment?: {
    status?: string | null;
  } | null;
  debt_dpto?: ReservationDebtDpto | null;
  periods?: ReservationPeriod[] | null;
  area?: ReservationArea | null;
  owner?: ReservationResident | null;
  dpto?: ReservationUnit | null;
};

/**
 * La fila del DETALLE (`fullType=DET`): todo lo de la lista más el rastro de
 * quién aprobó y quién canceló.
 */
export type ReservationDetailItem = ReservationListItem & {
  client_id?: string;
  paid_at?: string | null;
  approved_at?: string | null;
  /**
   * 🔴 Numérico (`ReservationApproval`), no char. Hasta el 2026-08-12 este
   * campo estaba declarado `string` y el módulo mandaba `"Y"`/`"N"`.
   */
  is_approved?: ReservationApproval | number;
  approved_by?: string | number | null;
  canceled_by?: string | number | null;
  canceled_at?: string | null;
  is_canceled?: boolean;
  updated_at?: string | null;
  deleted_at?: string | null;
  approved_user?: ReservationResident | null;
  canceled_user?: ReservationResident | null;
};

/** Lo que viaja en el `PUT /v3/reservations/{id}` de aprobar. */
export type ReservationApprovePayload = {
  approved_at: string;
  is_approved: ReservationApproval.APPROVED;
  obs: string;
};

/** Lo que viaja en el `PUT /v3/reservations/{id}` de rechazar. */
export type ReservationRejectPayload = {
  is_approved: ReservationApproval.REJECTED;
  reason: string;
};

/** Lo que viaja en el `PUT /v3/reservations/{id}` de cancelar. */
export type ReservationCancelPayload = {
  status: ReservationStatus.CANCELLED_MANUAL;
  reason: string;
};

/** `fullType=EXTRA`: lo que el alta necesita para armar sus selects. */
export type ReservationExtraData = {
  areas?: ReservationArea[];
  dptos?: ReservationUnit[];
};

export type ReservationVisibleRange = {
  start: Date;
  end: Date;
};

/** Una fila del cuadro de datos del detalle. */
export type ReservationDetailRow = {
  label: string;
  value: string;
};

export type ReservationDetailModalProps = {
  open: boolean;
  onClose: () => void;
  item?: ReservationDetailItem;
  reservationId?: string | number | null;
  /**
   * ⚠️ `Function` y no `() => void` porque los llamadores le pasan el `reLoad`
   * de `useAxios`, que `src/mk/hooks/useAxios.tsx` declara como `Function` a
   * secas. Apretarlo acá deja en rojo a `components/Index/Index.tsx`, y
   * arreglarlo de verdad es tocar `src/mk/`, que está fuera de este encargo.
   */
  reLoad?: Function;
};
