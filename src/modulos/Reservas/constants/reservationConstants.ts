// Tipos de estado de reserva
export type ReservationStatus = "W" | "A" | "Q" | "N" | "L" | "R" | "C" | "T" | "F";

// Configuración de estados de reserva con colores y etiquetas
export const RESERVATION_STATUS_CONFIG = {
  W: {
    label: "Por confirmar reserva",
    backgroundColor: "var(--cHoverWarning)",
    color: "var(--cWarning)",
    class: "statusW"
  },
  A: {
    label: "Pendiente de pago",
    backgroundColor: "var(--cHoverInfo)",
    color: "var(--cInfo)",
    class: "statusA"
  },
  Q: {
    label: "Por confirmar pago",
    backgroundColor: "#FFF3CD",
    color: "#856404",
    class: "statusQ"
  },
  N: {
    label: "Reservado sin pago",
    backgroundColor: "#E2E3E5",
    color: "#383D41",
    class: "statusN"
  },
  L: {
    label: "Reservado con pago",
    backgroundColor: "var(--cHoverSuccess)",
    color: "var(--cSuccess)",
    class: "statusL"
  },
  R: {
    label: "Reserva rechazada",
    backgroundColor: "var(--cHoverError)",
    color: "var(--cError)",
    class: "statusR"
  },
  C: {
    label: "Reserva cancelada manual",
    backgroundColor: "var(--cHoverCompl5)",
    color: "var(--cMediumAlert)",
    class: "statusC"
  },
  T: {
    label: "Reserva cancelada automática",
    backgroundColor: "#F8D7DA",
    color: "#721C24",
    class: "statusT"
  },
  F: {
    label: "Completado",
    backgroundColor: "var(--cHoverCompl1)",
    color: "var(--cWhite)",
    class: "statusF"
  }
} as const;

// Opciones para filtros de estado
export const RESERVATION_STATUS_OPTIONS = [
  { id: "ALL", name: "Todos" },
  { id: "W", name: "Por confirmar reserva" },
  { id: "A", name: "Pendiente de pago" },
  { id: "Q", name: "Por confirmar pago" },
  { id: "N", name: "Reservado sin pago" },
  { id: "L", name: "Reservado con pago" },
  { id: "R", name: "Reserva rechazada" },
  { id: "C", name: "Reserva cancelada manual" },
  { id: "T", name: "Reserva cancelada automática" },
  { id: "F", name: "Completado" },
];

/**
 * Función utilitaria para obtener el estado actualizado de una reserva
 * Cambia automáticamente el estado de "L" (Reservado con pago) a "F" (Completado)
 * si la fecha y hora de fin ya han pasado
 */
export const getUpdatedReservationStatus = (
  status?: ReservationStatus,
  dateEnd?: string,
  endTime?: string
): ReservationStatus | undefined => {
  if (!status) return undefined;

  // Solo cambiar a completado si está en estado "L" (Reservado con pago)
  if (status === "L" && dateEnd && endTime) {
    const now = new Date();
    const endDateTime = new Date(`${dateEnd}T${endTime}`);

    // Si la fecha/hora de fin ya pasó, cambiar a completado
    if (now > endDateTime) {
      return "F";
    }
  }

  return status;
};
