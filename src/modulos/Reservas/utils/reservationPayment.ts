import { paymentsApi } from "@/modulos/Payments/api";
import type { ReservationListItem } from "@/modulos/Reservas/types";
import { ReservationStatus } from "@/modulos/Reservas/constants/reservationConstants";
import { resolveReservationDisplayStatus } from "./reservationStatus";

export type ResolvedReservationPayment = {
  paymentId?: string | number | null;
  paymentStatus?: string | null;
};

type ReservationLike = ReservationListItem &
  Record<string, any> & {
    debt_dpto?: (ReservationListItem["debt_dpto"] & Record<string, any>) | null;
  };

const resolvedPaymentCache = new Map<
  string,
  Promise<ResolvedReservationPayment> | ResolvedReservationPayment
>();

const toKey = (value?: string | number | null) => {
  const key = String(value ?? "").trim();
  return key && key !== "0" && key.toLowerCase() !== "null" ? key : "";
};

export const getReservationDebtId = (reservation?: ReservationLike | null) =>
  reservation?.debt_dpto?.id ||
  reservation?.debt_id ||
  reservation?.debt_dpto_id ||
  null;

export const getReservationDisplayStatusInput = (
  reservation: ReservationLike,
  resolvedPayment?: ResolvedReservationPayment | null,
) => ({
  status: reservation?.status,
  dateEnd: reservation?.date_end,
  endTime: reservation?.end_time,
  debtStatus: reservation?.debt_dpto?.status || reservation?.debt_status,
  paymentStatus:
    reservation?.debt_dpto?.resolved_payment_status ||
    reservation?.debt_dpto?.payment?.status ||
    reservation?.resolved_payment_status ||
    reservation?.payment_status ||
    reservation?.payment?.status ||
    resolvedPayment?.paymentStatus,
  paymentId:
    reservation?.debt_dpto?.resolved_payment_id ||
    reservation?.debt_dpto?.payment_id ||
    reservation?.resolved_payment_id ||
    reservation?.payment_id ||
    resolvedPayment?.paymentId,
});

export const shouldFetchReservationResolvedPayment = (
  reservation: ReservationLike,
) => {
  if (!reservation?.id) return false;

  const status = resolveReservationDisplayStatus(
    getReservationDisplayStatusInput(reservation),
  );

  return status === ReservationStatus.PENDING_PAYMENT;
};

const getPaymentFromReservation = (
  reservation?: ReservationLike | null,
): ResolvedReservationPayment => ({
  paymentId:
    reservation?.debt_dpto?.resolved_payment_id ||
    reservation?.debt_dpto?.payment_id ||
    reservation?.resolved_payment_id ||
    reservation?.payment_id ||
    null,
  paymentStatus:
    reservation?.debt_dpto?.resolved_payment_status ||
    reservation?.debt_dpto?.payment?.status ||
    reservation?.resolved_payment_status ||
    reservation?.payment_status ||
    reservation?.payment?.status ||
    null,
});

const hasResolvedPaymentData = (payment: ResolvedReservationPayment) =>
  Boolean(payment.paymentId || payment.paymentStatus);

export const mergeResolvedPaymentIntoReservation = <T extends ReservationLike>(
  reservation: T,
  resolvedPayment?: ResolvedReservationPayment | null,
): T => {
  if (!hasResolvedPaymentData(resolvedPayment || {})) return reservation;

  return {
    ...reservation,
    debt_dpto: {
      ...(reservation.debt_dpto || {}),
      resolved_payment_id:
        resolvedPayment?.paymentId ||
        reservation.debt_dpto?.resolved_payment_id ||
        reservation.debt_dpto?.payment_id ||
        null,
      resolved_payment_status:
        resolvedPayment?.paymentStatus ||
        reservation.debt_dpto?.resolved_payment_status ||
        reservation.debt_dpto?.payment?.status ||
        null,
    },
  };
};

const fetchResolvedPaymentByDebtId = async (
  contextInstance: any,
  debtId: string | number,
): Promise<ResolvedReservationPayment> => {
  const debtKey = toKey(debtId);
  if (!debtKey || !contextInstance) return {};

  const cached = resolvedPaymentCache.get(debtKey);
  if (cached) return cached;

  const request = contextInstance
    .request({
      method: "GET",
      url: paymentsApi.resolvedPayment(debtKey),
    })
    .then((response: any) => ({
      paymentId: response?.data?.data?.payment_id || null,
      paymentStatus: response?.data?.data?.payment_status || null,
    }))
    .catch(() => ({}));

  resolvedPaymentCache.set(debtKey, request);
  const result = await request;

  if (hasResolvedPaymentData(result)) {
    resolvedPaymentCache.set(debtKey, result);
  } else {
    resolvedPaymentCache.delete(debtKey);
  }

  return result;
};

export const fetchResolvedPaymentForReservation = async (
  contextInstance: any,
  reservation: ReservationLike,
): Promise<ResolvedReservationPayment> => {
  const initialPayment = getPaymentFromReservation(reservation);
  if (hasResolvedPaymentData(initialPayment)) return initialPayment;

  let debtId = getReservationDebtId(reservation);
  let detailReservation: ReservationLike | null = null;

  if (!debtId && reservation?.id && contextInstance) {
    const response = await contextInstance.request({
      method: "GET",
      url: "/v3/reservations",
      params: {
        fullType: "DET",
        searchBy: reservation.id,
        page: 1,
        perPage: 1,
      },
    });

    detailReservation = response?.data?.data?.reservation || null;
    const detailPayment = getPaymentFromReservation(detailReservation);
    if (hasResolvedPaymentData(detailPayment)) return detailPayment;
    debtId = getReservationDebtId(detailReservation);
  }

  if (!debtId) return {};
  return fetchResolvedPaymentByDebtId(contextInstance, debtId);
};
