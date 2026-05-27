"use client";

import React, { memo, useCallback, useEffect } from "react";
import { format, format as formatDateFns, formatDistanceToNowStrict, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import Button from "@/mk/components/forms/Button/Button";
import Input from "@/mk/components/forms/Input/Input";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import LoadingScreen from "@/mk/components/ui/LoadingScreen/LoadingScreen";
import { useAuth } from "@/mk/contexts/AuthProvider";
import useAxios from "@/mk/hooks/useAxios";
import { getFullName } from "@/mk/utils/string";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import PaymentRenderView from "@/modulos/Payments/RenderView/RenderView";
import {
  RESERVATION_STATUS_CONFIG,
  type ReservationStatus,
} from "../constants/reservationConstants";
import {
  formatReservationPaymentTimeLimitMessage,
  resolveReservationDisplayStatus,
  shouldShowReservationPaymentTimeLimit,
} from "../utils/reservationStatus";
import styles from "./ReservationDetailModal.module.css";
import { paymentsApi } from "@/modulos/Payments/api";

type ReservationActor = {
  id?: string | number;
  name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  mother_last_name?: string | null;
  url_avatar?: string | null;
};

type ReservationArea = {
  title?: string | null;
  description?: string | null;
  images?: string[] | null;
  price?: string | number | null;
  is_free?: string | null;
  booking_mode?: string | null;
  cancellation_policy?: string | null;
  usage_rules?: string | null;
};

type ReservationDpto = {
  nro?: string | null;
  description?: string | null;
};

type ReservationItem = {
  id?: string | number;
  area_id?: string;
  owner_id?: string;
  client_id?: string;
  dpto_id?: number;
  debt_id_penalty?: string;
  debt_id?: string;
  date_at?: string;
  date_end?: string;
  people_count?: number;
  amount?: string | number;
  paid_at?: string | null;
  approved_at?: string | null;
  is_approved?: string;
  approved_by?: string | number | null;
  canceled_by?: string | number | null;
  canceled_at?: string | null;
  is_canceled?: string;
  obs?: string | null;
  reason?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  status?: ReservationStatus | "X" | string;
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
  periods?: Array<{ time_from?: string | null; time_to?: string | null }> | null;
  area?: ReservationArea | null;
  dpto?: ReservationDpto | null;
  owner?: ReservationActor | null;
  approved_user?: ReservationActor | null;
  canceled_user?: ReservationActor | null;
  debt_dpto?: {
    id?: string | number | null;
    payment_id?: string | number | null;
    resolved_payment_id?: string | number | null;
    resolved_payment_status?: string | null;
    status?: string | null;
    payment?: {
      status?: string | null;
    } | null;
  } | null;
};

interface ReservationDetailModalProps {
  open: boolean;
  onClose: () => void;
  item?: ReservationItem | Record<string, any>;
  reservationId?: string | number | null;
  reLoad?: Function;
}

const TERMINAL_STATUSES = new Set(["R", "C", "T", "F", "X", "M"]);
const REASON_LABELS: Record<string, string> = {
  R: "Motivo del rechazo",
  C: "Motivo de la cancelación",
  T: "Motivo de la cancelación",
  M: "Motivo del mantenimiento",
  X: "Motivo",
};

const getActorName = (actor?: ReservationActor | string | null, fallback = "") => {
  if (!actor) return fallback;
  if (typeof actor === "string") return actor || fallback;

  const fullName = getFullName({
    name: actor.name || undefined,
    middle_name: actor.middle_name || undefined,
    last_name: actor.last_name || undefined,
    mother_last_name: actor.mother_last_name || undefined,
  });

  return fullName || fallback;
};

const formatDateTimeValue = (value?: string | null) => {
  if (!value) return "-";

  try {
    return format(parseISO(value), "d 'de' MMM yyyy, HH:mm", { locale: es });
  } catch {
    return value;
  }
};

const formatRequestMoment = (value?: string | null) => {
  if (!value) return "-";

  try {
    return `${formatDistanceToNowStrict(parseISO(value), {
      addSuffix: true,
      locale: es,
    })} · ${formatDateTimeValue(value)}`;
  } catch {
    return formatDateTimeValue(value);
  }
};

const getFormattedReservationDate = (dateStr?: string | null) => {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return "Fecha inválida";

  try {
    return format(parseISO(`${dateStr}T00:00:00`), "EEEE, d 'de' MMMM yyyy", {
      locale: es,
    });
  } catch {
    return "Fecha inválida";
  }
};

const getFormattedReservationTime = (
  periods: ReservationItem["periods"],
  startTime?: string | null,
  endTime?: string | null,
) => {
  const safePeriods = Array.isArray(periods) ? [...periods] : [];
  const sortedPeriods = safePeriods.sort((left, right) =>
    String(left?.time_from || "").localeCompare(String(right?.time_from || "")),
  );

  if (sortedPeriods.length > 0) {
    return sortedPeriods
      .map((period) => {
        const periodStart = String(period?.time_from || "00:00:00").slice(0, 5);
        const periodEnd = String(period?.time_to || "00:00:00").slice(0, 5);
        return `${periodStart} - ${periodEnd}`;
      })
      .join(" / ");
  }

  if (startTime || endTime) {
    return `${String(startTime || "00:00:00").slice(0, 5)} - ${String(
      endTime || startTime || "00:00:00",
    ).slice(0, 5)}`;
  }

  return "Horario no especificado";
};

const getPriceDetails = (
  area: ReservationArea | null | undefined,
  totalAmount: string | number | undefined | null,
) => {
  const safeTotalAmount = totalAmount ?? 0;
  if (!area) return "No disponible";

  const price = Number.parseFloat(String(area.price || 0));
  const total = Number.parseFloat(String(safeTotalAmount));
  const isFreeExplicit = area.is_free === "A";
  const isPriceZero = Number.isNaN(price) || price <= 0;

  if (isFreeExplicit || isPriceZero) {
    return total > 0 ? `Gratis · Total Bs ${total.toFixed(2)}` : "Gratis";
  }

  return `Bs ${price.toFixed(2)}`;
};

const getStatusClassName = (statusKey?: string) => {
  switch (statusKey) {
    case "W":
      return styles.statusW;
    case "A":
      return styles.statusA;
    case "Q":
      return styles.statusQ;
    case "N":
      return styles.statusN;
    case "L":
      return styles.statusL;
    case "R":
      return styles.statusR;
    case "C":
      return styles.statusC;
    case "T":
      return styles.statusT;
    case "F":
      return styles.statusF;
    case "M":
      return styles.statusM;
    default:
      return styles.statusUnknown;
  }
};

const ReservationDetailModal: React.FC<ReservationDetailModalProps> = memo(
  ({ open, onClose, item, reservationId, reLoad }) => {
    const { showToast } = useAuth();
    const detailId = reservationId || item?.id;
    const shouldFetchDetail = open && Boolean(detailId);

    const { data, reLoad: reloadReservationDetail } = useAxios(
      shouldFetchDetail ? "/reservations" : null,
      "GET",
      {
        fullType: "DET",
        searchBy: detailId,
        page: 1,
        perPage: 1,
      },
      false,
    );

    const reservationDetail = (data?.data?.reservation || item || {}) as ReservationItem;
    const timeLimit = data?.data?.timeLimit as string | undefined;
    const formattedTimeLimit = formatReservationPaymentTimeLimitMessage(timeLimit);
    const { execute: executeAction } = useAxios();

    const [isActionLoading, setIsActionLoading] = React.useState(false);
    const [actionError, setActionError] = React.useState<string | null>(null);
    const [isRejectModalOpen, setIsRejectModalOpen] = React.useState(false);
    const [rejectionReason, setRejectionReason] = React.useState("");
    const [rejectErrors, setRejectErrors] = React.useState<any>({});
    const [openModalCancel, setOpenModalCancel] = React.useState(false);
    const [formState, setFormState] = React.useState<any>({});
    const [errors, setErrors] = React.useState({});
    const [showPaymentModal, setShowPaymentModal] = React.useState(false);
    const [resolvedPaymentId, setResolvedPaymentId] = React.useState<string | number | null>(
      null,
    );
    const [resolvedPaymentStatus, setResolvedPaymentStatus] =
      React.useState<string | null>(null);

    const handlePaymentModalClose = useCallback(() => {
      setShowPaymentModal(false);
      void reloadReservationDetail(null, true);
    }, [reloadReservationDetail]);

    const handleReservationDetailReload = useCallback(() => {
      void reloadReservationDetail(null, true);
    }, [reloadReservationDetail]);

    const statusKey = resolveReservationDisplayStatus({
      status: reservationDetail?.status as ReservationStatus | undefined,
      dateEnd: reservationDetail?.date_end || undefined,
      endTime: reservationDetail?.end_time || undefined,
      debtStatus: reservationDetail?.debt_dpto?.status || undefined,
      paymentStatus:
        resolvedPaymentStatus ||
        reservationDetail?.debt_dpto?.resolved_payment_status ||
        reservationDetail?.debt_dpto?.payment?.status ||
        undefined,
      paymentId:
        resolvedPaymentId ||
        reservationDetail?.debt_dpto?.resolved_payment_id ||
        reservationDetail?.debt_dpto?.payment_id ||
        undefined,
    });
    const currentStatus = statusKey
      ? RESERVATION_STATUS_CONFIG[statusKey as keyof typeof RESERVATION_STATUS_CONFIG]
      : null;

    const isMaintenance = statusKey === "M";
    const ownerName = getActorName(
      reservationDetail?.owner,
      isMaintenance ? "Mantenimiento administrativo" : "Residente no disponible",
    );
    const approvedUserName = getActorName(
      reservationDetail?.approved_user,
      isMaintenance ? "Administración" : "",
    );
    const canceledUserName = getActorName(reservationDetail?.canceled_user, "");
    const dptoLabel = reservationDetail?.dpto?.nro
      ? `Unidad ${reservationDetail.dpto.nro}`
      : reservationDetail?.dpto?.description || "Sin unidad";
    const resolvedDebtId =
      (reservationDetail?.debt_dpto as any)?.id || reservationDetail?.debt_id;
    const canShowPayment = Boolean(resolvedPaymentId);
    const canReviewRequest = reservationDetail?.status === "W";
    const canCancelReservation =
      Boolean(statusKey) &&
      !TERMINAL_STATUSES.has(String(statusKey)) &&
      statusKey !== "W";
    const showTimeLimit =
      Boolean(formattedTimeLimit) &&
      shouldShowReservationPaymentTimeLimit(statusKey);
    const reasonText = reservationDetail?.reason?.trim() || "";
    const obsText = reservationDetail?.obs?.trim() || "";
    const areaName = reservationDetail?.area?.title || "Área social";
    const approvalLabel =
      statusKey === "R"
        ? "Revisado por"
        : isMaintenance
          ? "Registrado por"
          : "Aprobado por";
    const approvalValue =
      approvedUserName || reservationDetail?.approved_at
        ? [approvedUserName || "Administración", formatDateTimeValue(reservationDetail?.approved_at)]
            .filter((value) => value && value !== "-")
            .join(" · ")
        : "";
    const cancellationValue =
      reservationDetail?.canceled_at || canceledUserName
        ? [
            canceledUserName || "Administración",
            formatDateTimeValue(reservationDetail?.canceled_at),
          ]
            .filter((value) => value && value !== "-")
            .join(" · ")
        : "";

    const detailRows = [
      {
        label: "Área social",
        value: areaName,
      },
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
        value: `${reservationDetail?.people_count ?? 0} persona${
          reservationDetail?.people_count === 1 ? "" : "s"
        }`,
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
        ? [
            {
              label: approvalLabel,
              value: approvalValue,
            },
          ]
        : []),
      ...(cancellationValue
        ? [
            {
              label: "Cancelada por",
              value: cancellationValue,
            },
          ]
        : []),
      ...(canShowPayment
        ? [
            {
              label: "Pago",
              value: "Comprobante disponible",
            },
          ]
        : []),
    ];

    useEffect(() => {
      setResolvedPaymentId(
        reservationDetail?.debt_dpto?.resolved_payment_id ||
          reservationDetail?.debt_dpto?.payment_id ||
          null,
      );
      setResolvedPaymentStatus(
        reservationDetail?.debt_dpto?.resolved_payment_status ||
          reservationDetail?.debt_dpto?.payment?.status ||
          null,
      );
    }, [
      reservationDetail?.debt_dpto?.payment?.status,
      reservationDetail?.debt_dpto?.payment_id,
      reservationDetail?.debt_dpto?.resolved_payment_id,
      reservationDetail?.debt_dpto?.resolved_payment_status,
    ]);

    useEffect(() => {
      if (!open || !resolvedDebtId) return;

      let cancelled = false;

      const fetchResolvedPayment = async () => {
        const { data } = await executeAction(
          paymentsApi.resolvedPayment(resolvedDebtId),
          "GET",
          {},
          false,
          true,
        );

        if (!cancelled && data?.success) {
          setResolvedPaymentId(data?.data?.payment_id || null);
          setResolvedPaymentStatus(data?.data?.payment_status || null);
        }
      };

      fetchResolvedPayment();

      return () => {
        cancelled = true;
      };
    }, [open, resolvedDebtId, executeAction]);

    const detailNotes = [
      ...(reasonText && REASON_LABELS[String(statusKey || "")] != null
        ? [
            {
              label: REASON_LABELS[String(statusKey || "")],
              value: reasonText,
            },
          ]
        : []),
      ...(obsText && obsText !== reasonText
        ? [
            {
              label: "Observaciones",
              value: obsText,
            },
          ]
        : []),
    ];

    const handleAcceptClick = async () => {
      if (!reservationDetail?.id || isActionLoading) return;

      setIsActionLoading(true);
      setActionError(null);

      const now = new Date();
      const formattedDate = formatDateFns(now, "yyyy-MM-dd HH:mm:ss");

      try {
        await executeAction(
          `/reservations/${reservationDetail.id}`,
          "PUT",
          {
            approved_at: formattedDate,
            is_approved: "Y",
            obs: "Aprobado",
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
            "Ocurrió un error al aprobar.",
        );
      } finally {
        setIsActionLoading(false);
      }
    };

    const handleRejectClick = () => {
      if (!reservationDetail?.id) return;
      setRejectionReason("");
      setRejectErrors({});
      setIsRejectModalOpen(true);
    };

    const confirmRejection = async () => {
      if (!reservationDetail?.id || isActionLoading) return;

      if (!rejectionReason || rejectionReason.trim() === "") {
        setRejectErrors({ reason: "Debe ingresar un motivo para el rechazo." });
        return;
      }

      setRejectErrors({});
      setIsActionLoading(true);
      setActionError(null);

      try {
        await executeAction(
          `/reservations/${reservationDetail.id}`,
          "PUT",
          { is_approved: "N", reason: rejectionReason.trim() },
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
            "Ocurrió un error al rechazar.",
        );
        setIsRejectModalOpen(false);
      } finally {
        setIsActionLoading(false);
      }
    };

    const handleChangeInput = (event: any) => {
      setFormState({ ...formState, [event.target.name]: event.target.value });
    };

    const validateReason = () => {
      let nextErrors: any = {};
      nextErrors = checkRules({
        value: formState.reason,
        rules: ["required"],
        key: "reason",
        errors: nextErrors,
      });

      setErrors(nextErrors);
      return nextErrors;
    };

    const onSaveCancel = async () => {
      if (hasErrors(validateReason())) return;

      const response = await executeAction(
        `/reservations/${reservationDetail?.id}`,
        "PUT",
        {
          status: "C",
          reason: formState?.reason,
        },
        false,
        true,
      );

      if (response?.data?.success) {
        setOpenModalCancel(false);
        showToast(response?.data?.message || "Reserva cancelada", "success");
        onClose();
        reLoad?.();
      } else {
        showToast(response?.data?.message || "Ocurrió un error", "error");
      }
    };

    return (
      <>
        <DataModal
          open={open}
          onClose={onClose}
          title="Detalle de la reserva"
          buttonText=""
          buttonCancel=""
          minWidth={739}
          maxWidth={920}
          variant="mini"
        >
          <LoadingScreen
            onlyLoading={Object.keys(reservationDetail).length === 0 && open}
            type="CardSkeleton"
          >
            {Object.keys(reservationDetail).length === 0 ? (
              <div className={styles.container}>
                <div className={styles.notFoundContainer}>
                  <p className={styles.notFoundText}>
                    No se encontró información de la reserva.
                  </p>
                  <p className={styles.notFoundSuggestion}>
                    Verifica los detalles o intenta de nuevo más tarde.
                  </p>
                </div>
              </div>
            ) : (
              <div className={styles.modalContent}>
                <div className={styles.summaryCard}>
                  <div className={styles.summaryTop}>
                    <div className={styles.summaryIdentity}>
                      {isMaintenance ? (
                        <div className={styles.systemBadge}>ADM</div>
                      ) : (
                        <Avatar
                          src={reservationDetail?.owner?.url_avatar || ""}
                          name={ownerName}
                          w={48}
                          h={48}
                        />
                      )}

                      <div className={styles.summaryText}>
                        <p className={styles.summaryEyebrow}>
                          {isMaintenance ? "Bloqueo administrativo" : "Solicitante"}
                        </p>
                        <h3 className={styles.summaryTitle}>
                          {isMaintenance ? "Mantenimiento administrativo" : ownerName}
                        </h3>
                        <p className={styles.summarySubtitle}>
                          {isMaintenance
                            ? approvalValue || "Registrado por administración"
                            : `${dptoLabel} · ${formatRequestMoment(
                                reservationDetail?.created_at,
                              )}`}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`${styles.statusBadge} ${getStatusClassName(
                        String(statusKey || reservationDetail?.status || ""),
                      )}`}
                    >
                      {currentStatus?.label || "Estado desconocido"}
                    </span>
                  </div>

                  <div className={styles.areaSummary}>
                    <p className={styles.summaryEyebrow}>Área social</p>
                    <h4 className={styles.areaTitle}>{areaName}</h4>
                    {reservationDetail?.area?.description ? (
                      <p className={styles.areaDescription}>
                        {reservationDetail.area.description}
                      </p>
                    ) : null}
                  </div>

                  {showTimeLimit ? (
                    <div className={styles.timeLimitAlert}>
                      {formattedTimeLimit}
                    </div>
                  ) : null}

                  <div className={styles.infoGrid}>
                    {detailRows.map((row) => (
                      <div key={row.label} className={styles.infoItem}>
                        <span className={styles.infoLabel}>{row.label}</span>
                        <span className={styles.infoValue}>{row.value}</span>
                      </div>
                    ))}
                  </div>

                  {detailNotes.length > 0 ? (
                    <div className={styles.noteStack}>
                      {detailNotes.map((note) => (
                        <div key={note.label} className={styles.noteBlock}>
                          <p className={styles.noteLabel}>{note.label}</p>
                          <p className={styles.noteValue}>{note.value}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                {actionError ? (
                  <div className={styles.errorBox}>Error: {actionError}</div>
                ) : null}

                {canReviewRequest ? (
                  <div className={styles.actionButtonsContainer}>
                    <Button
                      className={styles.secondaryActionButton}
                      onClick={handleRejectClick}
                      variant="secondary"
                      disabled={isActionLoading}
                    >
                      Rechazar solicitud
                    </Button>
                    <Button
                      className={styles.primaryActionButton}
                      onClick={handleAcceptClick}
                      variant="primary"
                      disabled={isActionLoading}
                    >
                      Aprobar solicitud
                    </Button>
                  </div>
                ) : null}

                {!canReviewRequest && (canCancelReservation || canShowPayment) ? (
                  <div className={styles.actionButtonsContainer}>
                    {canCancelReservation ? (
                      <Button
                        className={styles.secondaryActionButton}
                        onClick={() => setOpenModalCancel(true)}
                        variant="secondary"
                        disabled={isActionLoading}
                      >
                        Cancelar reserva
                      </Button>
                    ) : null}

                    {canShowPayment ? (
                      <Button
                        className={styles.primaryActionButton}
                        onClick={() => setShowPaymentModal(true)}
                        variant="primary"
                      >
                        Ver pago
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )}
          </LoadingScreen>
        </DataModal>

        {showPaymentModal ? (
          <PaymentRenderView
            open={showPaymentModal}
            onClose={handlePaymentModalClose}
            reLoad={handleReservationDetailReload}
            payment_id={resolvedPaymentId as string | number}
            noWaiting={true}
          />
        ) : null}

        {openModalCancel ? (
          <DataModal
            title="Cancelar reserva"
            open={openModalCancel}
            buttonText="Cancelar reserva"
            buttonCancel="Salir"
            onClose={() => setOpenModalCancel(false)}
            minWidth={686}
            maxWidth={760}
            onSave={onSaveCancel}
          >
            <div className={styles.modalBody}>
              <p className={styles.modalParagraph}>
                Indica el motivo por el cual quieres cancelar esta reserva.
              </p>
              <Input
                label="Motivo"
                name="reason"
                value={formState?.reason}
                onChange={handleChangeInput}
                required
                error={errors}
              />
            </div>
          </DataModal>
        ) : null}

        {isRejectModalOpen ? (
          <DataModal
            open={isRejectModalOpen}
            onClose={() => {
              setIsRejectModalOpen(false);
              setRejectErrors({});
            }}
            title="Rechazar solicitud"
            buttonText=""
            buttonCancel=""
            minWidth={486}
            maxWidth={560}
          >
            <div className={styles.modalBody}>
              <p className={styles.modalParagraph}>
                Indica el motivo para que el residente pueda comprender por qué
                se rechazó esta solicitud.
              </p>
              <Input
                name="reason"
                value={rejectionReason}
                onChange={(event) => {
                  setRejectionReason(event.target.value);
                  if (rejectErrors.reason) {
                    setRejectErrors({});
                  }
                }}
                placeholder="Escribe aquí por qué se rechaza la reserva..."
                required
                aria-invalid={!!rejectErrors.reason}
                aria-describedby={
                  rejectErrors.reason ? "rejection-error-message" : undefined
                }
              />
              {rejectErrors.reason ? (
                <span
                  id="rejection-error-message"
                  className={styles.rejectErrorMessage}
                >
                  {rejectErrors.reason}
                </span>
              ) : null}
            </div>

            <div
              className={`${styles.actionButtonsContainer} ${styles.rejectActions}`}
            >
              <Button
                className={styles.secondaryActionButton}
                onClick={() => setIsRejectModalOpen(false)}
                variant="secondary"
                disabled={isActionLoading}
              >
                Salir
              </Button>
              <Button
                className={styles.primaryActionButton}
                onClick={confirmRejection}
                variant="primary"
                disabled={isActionLoading}
              >
                Confirmar rechazo
              </Button>
            </div>
          </DataModal>
        ) : null}
      </>
    );
  },
);

ReservationDetailModal.displayName = "ReservationDetailModal";

export default ReservationDetailModal;
