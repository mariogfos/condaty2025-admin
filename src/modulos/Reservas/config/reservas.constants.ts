import { ReservationStatus } from "../Type/ReservaType";

type ReservationStatusConfigEntry = {
  label: string;
  backgroundColor: string;
  color: string;
  class: string;
};

/**
 * Cómo se llama y de qué color se pinta cada estado.
 *
 * ⚠️ Las palabras tienen que ser las mismas que `ReservationStatus::label()`
 * del API: esa tabla la usa el motor de reportes, y el día que la pantalla y
 * el PDF dijeran cosas distintas para la misma reserva nadie lo notaría hasta
 * que un residente reclame.
 */
export const RESERVATION_STATUS_CONFIG: Record<
  ReservationStatus,
  ReservationStatusConfigEntry
> = {
  [ReservationStatus.AWAITING_APPROVAL]: {
    label: "Esperando confirmación",
    backgroundColor: "#E9B01E33",
    color: "#E9B01E",
    class: "statusW",
  },
  [ReservationStatus.PENDING_PAYMENT]: {
    label: "Pago pendiente",
    backgroundColor: "#E9B01E33",
    color: "#E9B01E",
    class: "statusA",
  },
  [ReservationStatus.PAYMENT_SUBMITTED]: {
    label: "Por confirmar",
    backgroundColor: "#E9B01E33",
    color: "#E9B01E",
    class: "statusQ",
  },
  [ReservationStatus.RESERVED_UNPAID]: {
    label: "Reservado (sin pago)",
    backgroundColor: "#00E38C33",
    color: "#00E38C",
    class: "statusN",
  },
  [ReservationStatus.RESERVED_PAID]: {
    label: "Reservado (pagado)",
    backgroundColor: "#00E38C33",
    color: "#00E38C",
    class: "statusL",
  },
  [ReservationStatus.REJECTED]: {
    label: "Reserva rechazada",
    backgroundColor: "#E4605533",
    color: "#E46055",
    class: "statusR",
  },
  [ReservationStatus.CANCELLED_MANUAL]: {
    label: "Cancelada manualmente",
    backgroundColor: "#E4605533",
    color: "#E46055",
    class: "statusC",
  },
  [ReservationStatus.CANCELLED_AUTO]: {
    label: "Cancelada automática",
    backgroundColor: "#E4605533",
    color: "#E46055",
    class: "statusT",
  },
  [ReservationStatus.COMPLETED]: {
    label: "Finalizada",
    backgroundColor: "#00E38C33",
    color: "#00E38C",
    class: "statusF",
  },
  [ReservationStatus.LEGACY_REJECTED]: {
    label: "Rechazada",
    backgroundColor: "#E4605533",
    color: "#E46055",
    class: "statusX",
  },
  [ReservationStatus.MAINTENANCE]: {
    label: "Mantenimiento",
    backgroundColor: "#E4605533",
    color: "#e11907ff",
    class: "statusX",
  },
};

/**
 * El centinela que el motor del API descarta sin filtrar
 * (`SearchManager::applyFilters`). No es un estado.
 */
export const FILTER_ALL = "ALL";

/**
 * Opciones del filtro de estado de la lista.
 *
 * El `id` es el valor NUMÉRICO del enum pasado a string, porque el `Select`
 * compara por igualdad estricta de string. El back lo recibe en
 * `filterBy=status_reservation:<n>` y hace `ReservationStatus::tryFrom((int)…)`.
 *
 * 🔴 Nunca un char: un `"A"` acá llegaría a `(int) "A"` = 0, `tryFrom(0)`
 * devuelve null y el filtro **no filtra nada** — el usuario ve la lista entera
 * y le cree.
 */
export const RESERVATION_STATUS_OPTIONS: Array<{ id: string; name: string }> = [
  { id: FILTER_ALL, name: "Todos" },
  ...(
    [
      ReservationStatus.AWAITING_APPROVAL,
      ReservationStatus.PENDING_PAYMENT,
      ReservationStatus.PAYMENT_SUBMITTED,
      ReservationStatus.RESERVED_UNPAID,
      ReservationStatus.RESERVED_PAID,
      ReservationStatus.REJECTED,
      ReservationStatus.CANCELLED_MANUAL,
      ReservationStatus.CANCELLED_AUTO,
      ReservationStatus.COMPLETED,
      ReservationStatus.MAINTENANCE,
      // LEGACY_REJECTED queda fuera a propósito: es de sólo lectura, ninguna
      // reserva nueva puede llegar ahí.
    ] as const
  ).map((status) => ({
    id: String(status),
    name: RESERVATION_STATUS_CONFIG[status].label,
  })),
];

/**
 * Los períodos que acepta el filtro `date_at`.
 *
 * Los ids son los del `PeriodFilter` del API (`d`, `ld`, `w`, `lw`, `m`, `lm`,
 * `y`, `ly`). `custom` NO viaja: lo intercepta el front y lo traduce a un
 * rango `desde,hasta` — ver `useReservas`.
 */
export const RESERVATION_PERIOD_OPTIONS = [
  { id: FILTER_ALL, name: "Todos" },
  { id: "d", name: "Hoy" },
  { id: "ld", name: "Ayer" },
  { id: "w", name: "Esta semana" },
  { id: "lw", name: "Semana anterior" },
  { id: "m", name: "Este mes" },
  { id: "lm", name: "Mes anterior" },
  { id: "y", name: "Este año" },
  { id: "ly", name: "Año anterior" },
  { id: "custom", name: "Personalizado" },
] as const;

/** El id del período personalizado, que abre el modal en vez de filtrar. */
export const CUSTOM_PERIOD_ID = "custom";

/**
 * 🔴 EL ESPEJO DEL `ReservationsListConfig` DEL API.
 *
 * `app/Modules/Reservations/Crud/ReservationsListConfig.php` declara qué
 * acepta el listado. Acá está la MISMA declaración, del lado del front, para
 * que un test la compare contra lo que el módulo realmente manda.
 *
 * Por qué hace falta: **un filtro que el API no declara no filtra, y nadie
 * avisa**. No hay 4xx, no hay warning, no hay log: la pantalla muestra todas
 * las filas y el usuario cree que ése es el resultado. Es exactamente lo que
 * pasaba con `filterBy=status:1` de la pestaña de pendientes, que el back no
 * conocía y listaba TODAS las reservas.
 *
 * ⚠️ Si el API agrega o saca un filtro, este objeto se actualiza en el mismo
 * commit. El test `reservasApiContract.test.ts` sólo garantiza que el módulo
 * no se salga de lo declarado acá; que lo declarado acá coincida con el PHP es
 * responsabilidad de quien toque el PHP.
 */
export const RESERVATIONS_API_CONTRACT = {
  /** `filterBy=<nombre>:<valor>|<nombre>:<valor>` */
  filters: ["status", "status_reservation", "date_at"] as const,

  /** `sortBy=<campo>&orderBy=asc|desc` */
  sortableFields: [
    "id",
    "created_at",
    "updated_at",
    "date_at",
    "date_end",
    "start_time",
    "end_time",
    "status",
    "amount",
    "people_count",
  ] as const,

  /** `maxPerPage()` del ListConfig: pedir más se recorta en silencio. */
  maxPerPage: 100,

  /**
   * `searchBy` es UN solo término libre. Ya NO se manda
   * `campo:operador:valor`: el API lo busca en `area.title`, el nombre del
   * residente (partido en cuatro columnas, con AND entre palabras) y
   * `dpto.nro`.
   */
  searchableFields: ["area.title", "owner", "dpto.nro"] as const,

  /**
   * Parámetros que el API ya NO lee. Mandarlos no rompe nada —los ignora— pero
   * mentir sobre lo que se pide es cómo se acumulan los que sí importaban.
   */
  ignoredParams: ["cols", "joins"] as const,
} as const;

/** Textos de la pantalla. */
export const RESERVATIONS_COPY = {
  emptyMsg: "Sin reservas pendientes. cuando los residentes comiencen",
  emptyLine2: "a solicitar reservas de áreas sociales lo verás reflejado aquí.",
  areaUnavailable: "Área no disponible",
  residentUnavailable: "Residente no disponible",
  administration: "Administración",
  noUnit: "Sin Dpto.",
  unknownStatus: "Estado desconocido",
  titleAdd: "Nueva",
  exportLabel: "Exportar",
} as const;

/** Textos del detalle de una reserva. */
export const RESERVATION_DETAIL_COPY = {
  title: "Detalle de la reserva",
  notFound: "No se encontró información de la reserva.",
  notFoundSuggestion: "Verifica los detalles o intenta de nuevo más tarde.",
  loadError: "No se pudo cargar la reserva.",
  loadErrorSuggestion: "Revisa tu conexión e intenta de nuevo.",
  retry: "Reintentar",
  maintenanceOwner: "Mantenimiento administrativo",
  residentUnavailable: "Residente no disponible",
  administration: "Administración",
  noUnit: "Sin unidad",
  maintenanceEyebrow: "Bloqueo administrativo",
  requesterEyebrow: "Solicitante",
  areaEyebrow: "Área social",
  defaultAreaName: "Área social",
  approve: "Aprobar solicitud",
  reject: "Rechazar solicitud",
  cancel: "Cancelar reserva",
  viewPayment: "Ver pago",
  approveError: "Ocurrió un error al aprobar.",
  rejectError: "Ocurrió un error al rechazar.",
  cancelSuccess: "Reserva cancelada",
  genericError: "Ocurrió un error",
  rejectReasonRequired: "Debe ingresar un motivo para el rechazo.",
  approveObs: "Aprobado",
  timeUnspecified: "Horario no especificado",
  invalidDate: "Fecha inválida",
  priceUnavailable: "No disponible",
  free: "Gratis",
  paymentAvailable: "Comprobante disponible",
} as const;

/** Errores de validación del período personalizado. */
export const CUSTOM_PERIOD_ERRORS = {
  startRequired: "La fecha de inicio es obligatoria",
  endRequired: "La fecha de fin es obligatoria",
  startAfterEnd: "La fecha de inicio no puede ser mayor a la de fin",
  sameYear: "El periodo personalizado debe estar dentro del mismo año",
} as const;

/** Etiqueta del motivo, según por qué la reserva llegó a ese estado. */
export const REASON_LABELS: Partial<Record<ReservationStatus, string>> = {
  [ReservationStatus.REJECTED]: "Motivo del rechazo",
  [ReservationStatus.CANCELLED_MANUAL]: "Motivo de la cancelación",
  [ReservationStatus.CANCELLED_AUTO]: "Motivo de la cancelación",
  [ReservationStatus.MAINTENANCE]: "Motivo del mantenimiento",
  [ReservationStatus.LEGACY_REJECTED]: "Motivo",
};

/**
 * Estados desde los que ya no se puede cancelar: o terminaron, o los maneja
 * la administración por otro camino.
 */
export const TERMINAL_STATUSES: ReadonlySet<ReservationStatus> = new Set([
  ReservationStatus.REJECTED,
  ReservationStatus.CANCELLED_MANUAL,
  ReservationStatus.CANCELLED_AUTO,
  ReservationStatus.COMPLETED,
  ReservationStatus.LEGACY_REJECTED,
  ReservationStatus.MAINTENANCE,
]);
