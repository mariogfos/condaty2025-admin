"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { format as formatDateFns } from "date-fns";
import { useAuth } from "@/mk/contexts/AuthProvider";
import useAxios from "@/mk/hooks/useAxios";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import { paymentsApi } from "@/modulos/Payments/api";
import { reservationsApi } from "../api";
import {
  REASON_LABELS,
  RESERVATION_DETAIL_COPY,
  RESERVATION_STATUS_CONFIG,
  TERMINAL_STATUSES,
} from "../config/reservas.constants";
import {
  ReservationApproval,
  ReservationStatus,
  type ReservationDetailItem,
  type ReservationDetailRow,
} from "../Type/ReservaType";
import {
  formatPeopleCount,
  formatDateTimeValue,
  formatRequestMoment,
  getActorName,
  getFormattedReservationDate,
  getFormattedReservationTime,
  getPriceDetails,
} from "../utils/reservationFormat";
import {
  formatReservationPaymentTimeLimitMessage,
  resolveReservationDisplayStatus,
  shouldShowReservationPaymentTimeLimit,
} from "../utils/reservationStatus";

type UseReservationDetailArgs = {
  open: boolean;
  onClose: () => void;
  item?: ReservationDetailItem;
  reservationId?: string | number | null;
  /** Ver la nota de `ReservationDetailModalProps.reLoad`. */
  reLoad?: Function;
};

/**
 * Todo lo que el detalle de una reserva SABE y HACE. Sin JSX.
 *
 * ────────────────────────────────────────────────────────────────────────
 * 🔴 LOS DOS BUGS QUE ESTE ARCHIVO CIERRA (medidos el 2026-08-12)
 * ────────────────────────────────────────────────────────────────────────
 *
 * **1. El detalle pedía `"/api/v3/reservations"` → 404.** `API_BASE_URL` ya
 * termina en `/api`, así que axios armaba `.../api/api/v3/reservations`.
 * Ahora la URL sale de `reservationsApi`, que es la única del módulo.
 *
 * **2. Aprobar y Rechazar mandaban un char a una columna TINYINT.**
 * `is_approved: "Y"` / `"N"` —los valores de antes del flip— contra
 * `ReservationUpdateRequest`, que valida `integer` + `Rule::in([1,2,3])`.
 * Respuesta: 422. Ninguna reserva se aprobaba ni se rechazaba. Y la ruta iba
 * sin `/v3`, así que ni siquiera llegaba al validador. Ahora viajan
 * `ReservationApproval.APPROVED` (2) y `.REJECTED` (3), a
 * `reservationsApi.detail(id)`.
 */
export const useReservationDetail = ({
  open,
  onClose,
  item,
  reservationId,
  reLoad,
}: UseReservationDetailArgs) => {
  const { showToast } = useAuth();
  const detailId = reservationId || item?.id;
  const shouldFetchDetail = open && Boolean(detailId);

  const { data, reLoad: reloadReservationDetail } = useAxios(
    // 🔴 SIN el prefijo `/api`: lo trae el baseURL. Ver `api.ts`.
    shouldFetchDetail ? reservationsApi.base : null,
    "GET",
    {
      fullType: "DET",
      searchBy: detailId,
      page: 1,
      perPage: 1,
    },
    false,
  );

  const { execute: executeAction } = useAxios();

  /**
   * ⚠️ `useAxios` devuelve un `execute` NUEVO en cada render (no está
   * memoizado). Meterlo en las dependencias de un efecto lo hace correr en
   * cada render: el efecto del pago resuelto disparaba varias veces la misma
   * petición hasta que el estado dejaba de cambiar. La referencia va en un ref
   * y fuera de las dependencias.
   */
  const executeActionRef = useRef(executeAction);
  executeActionRef.current = executeAction;

  const reservationDetail = (data?.data?.reservation ||
    item ||
    {}) as ReservationDetailItem;
  const timeLimit = data?.data?.timeLimit as string | undefined;
  const formattedTimeLimit = formatReservationPaymentTimeLimitMessage(timeLimit);

  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectErrors, setRejectErrors] = useState<Record<string, string>>({});
  const [openModalCancel, setOpenModalCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelErrors, setCancelErrors] = useState<Record<string, string>>({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [resolvedPaymentId, setResolvedPaymentId] = useState<
    string | number | null
  >(null);
  const [resolvedPaymentStatus, setResolvedPaymentStatus] = useState<
    string | null
  >(null);

  const debtDpto = reservationDetail?.debt_dpto;
  const resolvedDebtId = debtDpto?.id || reservationDetail?.debt_id;

  // Lo que ya vino en la fila manda; el efecto de abajo sólo completa lo que
  // falte.
  useEffect(() => {
    setResolvedPaymentId(
      debtDpto?.resolved_payment_id || debtDpto?.payment_id || null,
    );
    setResolvedPaymentStatus(
      debtDpto?.resolved_payment_status || debtDpto?.payment?.status || null,
    );
  }, [
    debtDpto?.payment?.status,
    debtDpto?.payment_id,
    debtDpto?.resolved_payment_id,
    debtDpto?.resolved_payment_status,
  ]);

  useEffect(() => {
    if (!open || !resolvedDebtId) return;

    let cancelled = false;

    const fetchResolvedPayment = async () => {
      const { data: resolved } = await executeActionRef.current(
        paymentsApi.resolvedPayment(resolvedDebtId),
        "GET",
        {},
        false,
        true,
      );

      if (!cancelled && resolved?.success) {
        setResolvedPaymentId(resolved?.data?.payment_id || null);
        setResolvedPaymentStatus(resolved?.data?.payment_status || null);
      }
    };

    void fetchResolvedPayment();

    return () => {
      cancelled = true;
    };
  }, [open, resolvedDebtId]);

  const statusKey = resolveReservationDisplayStatus({
    status: reservationDetail?.status,
    dateEnd: reservationDetail?.date_end || undefined,
    endTime: reservationDetail?.end_time || undefined,
    debtStatus: debtDpto?.status || undefined,
    paymentStatus:
      resolvedPaymentStatus ||
      debtDpto?.resolved_payment_status ||
      debtDpto?.payment?.status ||
      undefined,
    paymentId:
      resolvedPaymentId ||
      debtDpto?.resolved_payment_id ||
      debtDpto?.payment_id ||
      undefined,
  });
  const currentStatus =
    statusKey !== undefined ? RESERVATION_STATUS_CONFIG[statusKey] : null;

  const isMaintenance = statusKey === ReservationStatus.MAINTENANCE;
  const ownerName = getActorName(
    reservationDetail?.owner,
    isMaintenance
      ? RESERVATION_DETAIL_COPY.maintenanceOwner
      : RESERVATION_DETAIL_COPY.residentUnavailable,
  );
  const approvedUserName = getActorName(
    reservationDetail?.approved_user,
    isMaintenance ? RESERVATION_DETAIL_COPY.administration : "",
  );
  const canceledUserName = getActorName(reservationDetail?.canceled_user, "");
  const dptoLabel = reservationDetail?.dpto?.nro
    ? `Unidad ${reservationDetail.dpto.nro}`
    : reservationDetail?.dpto?.description || RESERVATION_DETAIL_COPY.noUnit;

  const canShowPayment = Boolean(resolvedPaymentId);

  /**
   * 🔴 El permiso para aprobar/rechazar mira la COLUMNA (`status`), no el
   * estado derivado: sólo una reserva que todavía está esperando decisión se
   * puede aprobar. El derivado puede decir "Pago pendiente" por el estado de
   * la deuda y eso no habilita nada.
   */
  const canReviewRequest =
    Number(reservationDetail?.status) === ReservationStatus.AWAITING_APPROVAL;

  const canCancelReservation =
    statusKey !== undefined &&
    !TERMINAL_STATUSES.has(statusKey) &&
    statusKey !== ReservationStatus.AWAITING_APPROVAL;

  const showTimeLimit =
    Boolean(formattedTimeLimit) &&
    shouldShowReservationPaymentTimeLimit(statusKey);

  const reasonText = reservationDetail?.reason?.trim() || "";
  const obsText = reservationDetail?.obs?.trim() || "";
  const areaName =
    reservationDetail?.area?.title || RESERVATION_DETAIL_COPY.defaultAreaName;

  const approvalLabel =
    statusKey === ReservationStatus.REJECTED
      ? "Revisado por"
      : isMaintenance
        ? "Registrado por"
        : "Aprobado por";

  const approvalValue =
    approvedUserName || reservationDetail?.approved_at
      ? [
          approvedUserName || RESERVATION_DETAIL_COPY.administration,
          formatDateTimeValue(reservationDetail?.approved_at),
        ]
          .filter((value) => value && value !== "-")
          .join(" · ")
      : "";

  const cancellationValue =
    reservationDetail?.canceled_at || canceledUserName
      ? [
          canceledUserName || RESERVATION_DETAIL_COPY.administration,
          formatDateTimeValue(reservationDetail?.canceled_at),
        ]
          .filter((value) => value && value !== "-")
          .join(" · ")
      : "";

  const detailRows: ReservationDetailRow[] = [
    { label: "Área social", value: areaName },
    {
      label: "Fecha del evento",
      value: getFormattedReservationDate(reservationDetail?.date_at),
    },
    {
      label: "Horario",
      value: getFormattedReservationTime(
        reservationDetail?.periods,
        reservationDetail?.start_time,
        reservationDetail?.end_time,
      ),
    },
    {
      label: "Personas",
      value: formatPeopleCount(reservationDetail?.people_count),
    },
    {
      label: "Precio",
      value: getPriceDetails(reservationDetail?.area, reservationDetail?.amount),
    },
    {
      label: "Solicitada",
      value: formatRequestMoment(reservationDetail?.created_at),
    },
    ...(approvalValue
      ? [{ label: approvalLabel, value: approvalValue }]
      : []),
    ...(cancellationValue
      ? [{ label: "Cancelada por", value: cancellationValue }]
      : []),
    ...(canShowPayment
      ? [
          {
            label: "Pago",
            value: RESERVATION_DETAIL_COPY.paymentAvailable,
          },
        ]
      : []),
  ];

  const reasonLabel = statusKey !== undefined ? REASON_LABELS[statusKey] : undefined;
  const detailNotes: ReservationDetailRow[] = [
    ...(reasonText && reasonLabel
      ? [{ label: reasonLabel, value: reasonText }]
      : []),
    ...(obsText && obsText !== reasonText
      ? [{ label: "Observaciones", value: obsText }]
      : []),
  ];

  const isEmpty = Object.keys(reservationDetail).length === 0;

  const handlePaymentModalClose = useCallback(() => {
    setShowPaymentModal(false);
    void reloadReservationDetail(null, true);
  }, [reloadReservationDetail]);

  const handleReservationDetailReload = useCallback(() => {
    void reloadReservationDetail(null, true);
  }, [reloadReservationDetail]);

  /** Aprueba la solicitud: `is_approved = 2`, numérico. */
  const approveReservation = useCallback(async () => {
    if (!reservationDetail?.id || isActionLoading) return;

    setIsActionLoading(true);
    setActionError(null);

    try {
      await executeActionRef.current(
        reservationsApi.detail(reservationDetail.id),
        "PUT",
        {
          approved_at: formatDateFns(new Date(), "yyyy-MM-dd HH:mm:ss"),
          is_approved: ReservationApproval.APPROVED,
          obs: RESERVATION_DETAIL_COPY.approveObs,
        },
        false,
        true,
      );
      reLoad?.();
      onClose();
    } catch (error: any) {
      setActionError(
        error?.response?.data?.message ||
          error?.message ||
          RESERVATION_DETAIL_COPY.approveError,
      );
    } finally {
      setIsActionLoading(false);
    }
  }, [reservationDetail?.id, isActionLoading, reLoad, onClose]);

  const openRejectModal = useCallback(() => {
    if (!reservationDetail?.id) return;
    setRejectionReason("");
    setRejectErrors({});
    setIsRejectModalOpen(true);
  }, [reservationDetail?.id]);

  const closeRejectModal = useCallback(() => {
    setIsRejectModalOpen(false);
    setRejectErrors({});
  }, []);

  const changeRejectionReason = useCallback((value: string) => {
    setRejectionReason(value);
    setRejectErrors({});
  }, []);

  /** Rechaza la solicitud: `is_approved = 3`, numérico, con motivo obligatorio. */
  const rejectReservation = useCallback(async () => {
    if (!reservationDetail?.id || isActionLoading) return;

    if (!rejectionReason || rejectionReason.trim() === "") {
      setRejectErrors({ reason: RESERVATION_DETAIL_COPY.rejectReasonRequired });
      return;
    }

    setRejectErrors({});
    setIsActionLoading(true);
    setActionError(null);

    try {
      await executeActionRef.current(
        reservationsApi.detail(reservationDetail.id),
        "PUT",
        {
          is_approved: ReservationApproval.REJECTED,
          reason: rejectionReason.trim(),
        },
        false,
        true,
      );

      setIsRejectModalOpen(false);
      onClose();
      reLoad?.();
    } catch (error: any) {
      setActionError(
        error?.response?.data?.message ||
          error?.message ||
          RESERVATION_DETAIL_COPY.rejectError,
      );
      setIsRejectModalOpen(false);
    } finally {
      setIsActionLoading(false);
    }
  }, [reservationDetail?.id, isActionLoading, rejectionReason, onClose, reLoad]);

  const openCancelModal = useCallback(() => {
    setCancelReason("");
    setCancelErrors({});
    setOpenModalCancel(true);
  }, []);

  const closeCancelModal = useCallback(() => setOpenModalCancel(false), []);

  const changeCancelReason = useCallback((value: string) => {
    setCancelReason(value);
  }, []);

  /** Cancela la reserva: `status = 7` (CANCELLED_MANUAL), numérico. */
  const cancelReservation = useCallback(async () => {
    // `checkRules` devuelve el mapa de errores cuando se le pasa un objeto en
    // `errors`; el `string | null` de su firma es para el otro modo de uso.
    const nextErrors = (checkRules({
      value: cancelReason,
      rules: ["required"],
      key: "reason",
      errors: {},
    }) || {}) as Record<string, string>;
    setCancelErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    const response = await executeActionRef.current(
      reservationsApi.detail(reservationDetail?.id as string | number),
      "PUT",
      {
        status: ReservationStatus.CANCELLED_MANUAL,
        reason: cancelReason,
      },
      false,
      true,
    );

    if (response?.data?.success) {
      setOpenModalCancel(false);
      showToast?.(
        response?.data?.message || RESERVATION_DETAIL_COPY.cancelSuccess,
        "success",
      );
      onClose();
      reLoad?.();
    } else {
      showToast?.(
        response?.data?.message || RESERVATION_DETAIL_COPY.genericError,
        "error",
      );
    }
  }, [cancelReason, reservationDetail?.id, showToast, onClose, reLoad]);

  // Sin `useMemo`: `detailRows` y `detailNotes` se rearman en cada render, así
  // que memoizar el objeto de retorno no ahorraría un solo re-render y sí
  // escondería una lista de dependencias que se desincroniza en silencio.
  return {
    // Datos
    reservationDetail,
    isEmpty,
    statusKey,
    currentStatus,
    detailRows,
    detailNotes,
    ownerName,
    areaName,
    dptoLabel,
    approvalValue,
    formattedTimeLimit,
    resolvedPaymentId,

    // Qué se puede hacer
    isMaintenance,
    canReviewRequest,
    canCancelReservation,
    canShowPayment,
    showTimeLimit,
    isActionLoading,
    actionError,

    // Modal de pago
    showPaymentModal,
    openPaymentModal: () => setShowPaymentModal(true),
    handlePaymentModalClose,
    handleReservationDetailReload,

    // Aprobar / rechazar
    approveReservation,
    openRejectModal,
    closeRejectModal,
    rejectReservation,
    isRejectModalOpen,
    rejectionReason,
    rejectErrors,
    changeRejectionReason,

    // Cancelar
    openModalCancel,
    openCancelModal,
    closeCancelModal,
    cancelReason,
    cancelErrors,
    changeCancelReason,
    cancelReservation,
  };
};

export default useReservationDetail;
