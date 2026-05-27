import {
  getUpdatedReservationStatus,
  type ReservationStatus,
} from "@/modulos/Reservas/constants/reservationConstants";

const TERMINAL_OR_MANUAL_STATUSES = new Set([
  "W",
  "R",
  "C",
  "T",
  "F",
  "M",
]);

const PENDING_DEBT_STATUSES = new Set(["A", "M", "I", "E"]);

type ReservationStatusInput = {
  status?: ReservationStatus | "X" | string | null;
  dateEnd?: string | null;
  endTime?: string | null;
  debtStatus?: string | null;
  paymentStatus?: string | null;
  paymentId?: string | number | null;
};

const hasPaymentEvidence = (paymentId?: string | number | null) => {
  const normalized = String(paymentId ?? "").trim().toLowerCase();
  return normalized !== "" && normalized !== "0" && normalized !== "null";
};

export const resolveReservationDisplayStatus = ({
  status,
  dateEnd,
  endTime,
  debtStatus,
  paymentStatus,
  paymentId,
}: ReservationStatusInput): string => {
  const updatedStatus = getUpdatedReservationStatus(
    status as ReservationStatus | undefined,
    dateEnd || undefined,
    endTime || undefined,
  );
  const currentStatus = String(updatedStatus || status || "").trim();

  if (TERMINAL_OR_MANUAL_STATUSES.has(currentStatus)) {
    return currentStatus;
  }

  const nextPaymentStatus = String(paymentStatus || "").trim();
  const nextDebtStatus = String(debtStatus || "").trim();

  if (
    (nextPaymentStatus === "P" && nextDebtStatus !== "I") ||
    nextDebtStatus === "P"
  ) {
    return "L";
  }

  if (
    nextPaymentStatus === "S" ||
    nextDebtStatus === "S" ||
    (!nextPaymentStatus && hasPaymentEvidence(paymentId))
  ) {
    return "Q";
  }

  if (PENDING_DEBT_STATUSES.has(nextDebtStatus) && currentStatus !== "N") {
    return "A";
  }

  return currentStatus;
};

export const shouldShowReservationPaymentTimeLimit = (status?: string | null) =>
  status === "A";

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
