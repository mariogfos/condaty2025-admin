// Tipos de estado de reserva
export type ReservationStatus = "W" | "A" | "X" | "C" | "F";

// Configuración de estados de reserva con colores y etiquetas
export const RESERVATION_STATUS_CONFIG = {
  W: {
    label: "Por confirmar",
    backgroundColor: "var(--cHoverWarning)",
    color: "var(--cWarning)",
    class: "statusW"
  },
  A: {
    label: "Reservado",
    backgroundColor: "var(--cHoverSuccess)",
    color: "var(--cSuccess)",
    class: "statusA"
  },
  X: {
    label: "Rechazado",
    backgroundColor: "var(--cHoverError)",
    color: "var(--cError)",
    class: "statusX"
  },
  C: {
    label: "Cancelado",
    backgroundColor: "var(--cHoverCompl5)",
    color: "var(--cMediumAlert)",
    class: "statusC"
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
  { id: "W", name: "Por confirmar" },
  { id: "A", name: "Reservado" },
  { id: "X", name: "Rechazado" },
  { id: "C", name: "Cancelado" },
  { id: "F", name: "Completado" },
];

/**
 * Función utilitaria para obtener el estado actualizado de una reserva
 * Cambia automáticamente el estado de "A" (Reservado) a "F" (Completado)
 * si la fecha y hora de fin ya pasaron
 */
export const getUpdatedReservationStatus = (
  status?: ReservationStatus,
  dateEnd?: string,
  endTime?: string
): ReservationStatus | undefined => {
  if (!status) return status;

  // Solo procesar si el estado es "A" (Reservado)
  if (status !== "A") return status;

  // Validar que tenemos los datos necesarios
  if (!dateEnd || !endTime) return status;

  try {
    const dateEndObj = new Date(dateEnd + "T" + endTime);
    if (isNaN(dateEndObj.getTime())) return status;

    const dateEndString = dateEndObj.toISOString().split(".")[0];
    const currentDateString = new Date().toISOString().split(".")[0];

    // Si la fecha de fin ya pasó, cambiar a "F" (Completado)
    if (dateEndString < currentDateString) {
      return "F";
    }
  } catch (error) {
    console.error("Error parsing reservation date:", error);
  }

  return status;
};
