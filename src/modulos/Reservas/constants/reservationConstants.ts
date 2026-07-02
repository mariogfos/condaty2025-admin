// Estado de reserva — enum numérico canónico (sincronizado con el backend
// App\Modules\Reservations\Enums\ReservationStatus). La columna reservations.status
// y la serialización de la API son numéricas; el front compara contra estos valores.
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

type ReservationStatusConfigEntry = {
  label: string;
  backgroundColor: string;
  color: string;
  class: string;
};

// Configuración de estados de reserva con colores y etiquetas
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

// Opciones para filtros de estado. El id es el valor numérico del enum como string
// (el Select multiSelect compara por igualdad estricta de string; el backend
// status_reservation acepta el valor numérico vía == loose).
export const RESERVATION_STATUS_OPTIONS: Array<{
  id: string;
  name: string;
}> = [
  { id: "ALL", name: "Todos" },
  { id: String(ReservationStatus.AWAITING_APPROVAL), name: "Esperando confirmación" },
  { id: String(ReservationStatus.PENDING_PAYMENT), name: "Pago pendiente" },
  { id: String(ReservationStatus.PAYMENT_SUBMITTED), name: "Por confirmar" },
  { id: String(ReservationStatus.RESERVED_UNPAID), name: "Reservado (sin pago)" },
  { id: String(ReservationStatus.RESERVED_PAID), name: "Reservado (pagado)" },
  { id: String(ReservationStatus.REJECTED), name: "Reserva rechazada" },
  { id: String(ReservationStatus.CANCELLED_MANUAL), name: "Cancelada manualmente" },
  { id: String(ReservationStatus.CANCELLED_AUTO), name: "Cancelada automática" },
  { id: String(ReservationStatus.COMPLETED), name: "Finalizada" },
  { id: String(ReservationStatus.MAINTENANCE), name: "Mantenimiento" },
  // { id: String(ReservationStatus.LEGACY_REJECTED), name: "Rechazada" },
];

/**
 * Función utilitaria para obtener el estado actualizado de una reserva
 * Cambia automáticamente el estado de "L" (Reservado con pago) a "F" (Completado)
 * si la fecha y hora de fin ya han pasado
 */
export const getUpdatedReservationStatus = (
  status?: ReservationStatus,
  dateEnd?: string,
  endTime?: string,
): ReservationStatus | undefined => {
  if (status === undefined || status === null) return undefined;

  // // Solo cambiar a completado si está en estado RESERVED_PAID
  // if (status === ReservationStatus.RESERVED_PAID && dateEnd && endTime) {
  //   const now = new Date();
  //   const endDateTime = new Date(`${dateEnd}T${endTime}Z`);
  //   if (now > endDateTime) {
  //     return ReservationStatus.COMPLETED;
  //   }
  // }
  // if (status === ReservationStatus.RESERVED_UNPAID && dateEnd && endTime) {
  //   const now = new Date();
  //   const endDateTime = new Date(`${dateEnd}T${endTime}Z`);
  //   if (now > endDateTime) {
  //     return ReservationStatus.COMPLETED;
  //   }
  // }

  return status;
};
