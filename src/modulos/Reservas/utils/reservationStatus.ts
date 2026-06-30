import {
  getUpdatedReservationStatus,
  ReservationStatus,
} from "@/modulos/Reservas/constants/reservationConstants";

// Estados de reserva terminales o manuales (dominio RESERVA → numérico).
const TERMINAL_OR_MANUAL_STATUSES = new Set<ReservationStatus>([
  ReservationStatus.AWAITING_APPROVAL, // W
  ReservationStatus.REJECTED, // R
  ReservationStatus.CANCELLED_MANUAL, // C
  ReservationStatus.CANCELLED_AUTO, // T
  ReservationStatus.COMPLETED, // F
  ReservationStatus.MAINTENANCE, // M
]);

// OJO cross-domain: estos son estados de DEUDA (debt_dptos.status), NO de reserva.
// Tras S6.5 slices 1-2 la deuda/pago ya llegan numéricos, por lo que estos compares
// string quedan inertes y la API ya entrega reservations.status resuelto. Se migran
// en el slice de string-stragglers sistémicos (DEFERRED), no en este.
const PENDING_DEBT_STATUSES = new Set(["A", "M", "I", "E"]);

type ReservationStatusInput = {
  status?: ReservationStatus | number | string | null;
  dateEnd?: string | null;
  endTime?: string | null;
  debtStatus?: string | number | null;
  paymentStatus?: string | number | null;
  paymentId?: string | number | null;
};

const hasPaymentEvidence = (paymentId?: string | number | null) => {
  const normalized = String(paymentId ?? "").trim().toLowerCase();
  return normalized !== "" && normalized !== "0" && normalized !== "null";
};

const normalizeReservationStatus = (
  status?: ReservationStatus | number | string | null,
): ReservationStatus | undefined => {
  if (status === null || status === undefined || status === "") return undefined;
  const numeric = typeof status === "number" ? status : Number(status);
  return Number.isFinite(numeric) ? (numeric as ReservationStatus) : undefined;
};

export const resolveReservationDisplayStatus = ({
  status,
  dateEnd,
  endTime,
  debtStatus,
  paymentStatus,
  paymentId,
}: ReservationStatusInput): ReservationStatus | undefined => {
  const normalizedStatus = normalizeReservationStatus(status);
  const updatedStatus = getUpdatedReservationStatus(
    normalizedStatus,
    dateEnd || undefined,
    endTime || undefined,
  );
  const currentStatus = updatedStatus ?? normalizedStatus;

  if (currentStatus !== undefined && TERMINAL_OR_MANUAL_STATUSES.has(currentStatus)) {
    return currentStatus;
  }

  // DEFERRED (string-straggler slice): debtStatus/paymentStatus son dominio
  // deuda/pago (ya numéricos); estos compares string no disparan hoy y la API
  // entrega reservations.status ya resuelto. Los returns son dominio reserva → numérico.
  const nextPaymentStatus = String(paymentStatus || "").trim();
  const nextDebtStatus = String(debtStatus || "").trim();

  if (
    (nextPaymentStatus === "P" && nextDebtStatus !== "I") ||
    nextDebtStatus === "P"
  ) {
    return ReservationStatus.RESERVED_PAID;
  }

  if (
    nextPaymentStatus === "S" ||
    nextDebtStatus === "S" ||
    (!nextPaymentStatus && hasPaymentEvidence(paymentId))
  ) {
    return ReservationStatus.PAYMENT_SUBMITTED;
  }

  if (
    PENDING_DEBT_STATUSES.has(nextDebtStatus) &&
    currentStatus !== ReservationStatus.RESERVED_UNPAID
  ) {
    return ReservationStatus.PENDING_PAYMENT;
  }

  return currentStatus;
};

export const shouldShowReservationPaymentTimeLimit = (
  status?: ReservationStatus | number | null,
) => status === ReservationStatus.PENDING_PAYMENT;

export const formatReservationPaymentTimeLimitMessage = (
  value?: string | null,
) => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  if (
    raw.startsWith("El residente tiene") ||
    raw.startsWith("El tiempo para completar el pago venció")
  ) {
    return raw;
  }

  const normalized = raw.replace(/-/g, "").replace(/\s+/g, " ").trim();

  if (/Se acabó el tiempo límite/i.test(normalized)) {
    return "El tiempo para completar el pago venció y la reserva se cancelará automáticamente.";
  }

  const hoursMatch = normalized.match(/(\d+)\s*hora/i);
  const minutesMatch = normalized.match(/(\d+)\s*minuto/i);

  if (hoursMatch && minutesMatch) {
    const hours = Number.parseInt(hoursMatch[1], 10);
    const minutes = Number.parseInt(minutesMatch[1], 10);
    return `El residente tiene ${hours} hora${hours === 1 ? "" : "s"} ${minutes} minuto${
      minutes === 1 ? "" : "s"
    } para completar su pago o la reserva se cancelará automáticamente.`;
  }

  if (hoursMatch) {
    const hours = Number.parseInt(hoursMatch[1], 10);
    return `El residente tiene ${hours} hora${hours === 1 ? "" : "s"} para completar su pago o la reserva se cancelará automáticamente.`;
  }

  if (minutesMatch) {
    const minutes = Number.parseInt(minutesMatch[1], 10);
    return `El residente tiene ${minutes} minuto${minutes === 1 ? "" : "s"} para completar su pago o la reserva se cancelará automáticamente.`;
  }

  return raw;
};
