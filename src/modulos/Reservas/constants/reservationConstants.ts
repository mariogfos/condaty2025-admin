// Tipos de estado de reserva
export type ReservationStatus = "W" | "A" | "Q" | "N" | "L" | "R" | "C" | "T" | "F";

// Configuración de estados de reserva con colores y etiquetas
export const RESERVATION_STATUS_CONFIG = {
  W: {
    label: "Esperando confirmación",
    backgroundColor: "#FDF2D1",
    color: "#E9B01E",
    class: "statusW"
  },
  A: {
    label: "Pago pendiente",
    backgroundColor: "#FDF2D1",
    color: "#E9B01E",
    class: "statusA"
  },
  Q: {
    label: "Pago por confirmar",
    backgroundColor: "#FDF2D1",
    color: "#E9B01E",
    class: "statusQ"
  },
  N: {
    label: "Reservado (sin pago)",
    backgroundColor: "#E6F9F2",
    color: "#00E38C",
    class: "statusN"
  },
  L: {
    label: "Reservado (pagado)",
    backgroundColor: "#E6F9F2",
    color: "#00E38C",
    class: "statusL"
  },
  R: {
    label: "Reserva rechazada",
    backgroundColor: "#FDEAEA",
    color: "#E46055",
    class: "statusR"
  },
  C: {
    label: "Cancelada por usuario",
    backgroundColor: "#FDEAEA",
    color: "#E46055",
    class: "statusC"
  },
  T: {
    label: "Cancelada automática",
    backgroundColor: "#FDEAEA",
    color: "#E46055",
    class: "statusT"
  },
  F: {
    label: "Finalizada",
    backgroundColor: "#E6F9F2",
    color: "#00E38C",
    class: "statusF"
  }
} as const;

// Opciones para filtros de estado
export const RESERVATION_STATUS_OPTIONS = [
  { id: "ALL", name: "Todos" },
  { id: "W", name: "Esperando confirmación" },
  { id: "A", name: "Pago pendiente" },
  { id: "Q", name: "Pago por confirmar" },
  { id: "N", name: "Reservado (sin pago)" },
  { id: "L", name: "Reservado (pagado)" },
  { id: "R", name: "Reserva rechazada" },
  { id: "C", name: "Cancelada por usuario" },
  { id: "T", name: "Cancelada automática" },
  { id: "F", name: "Finalizada" },
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
