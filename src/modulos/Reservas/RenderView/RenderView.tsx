"use client";

import React, { memo } from "react";
import Button from "@/mk/components/forms/Button/Button";
import Input from "@/mk/components/forms/Input/Input";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import LoadingScreen from "@/mk/components/ui/LoadingScreen/LoadingScreen";
import PaymentRenderView from "@/modulos/Payments/RenderView/RenderView";
import {
  RESERVATION_DETAIL_COPY,
  RESERVATIONS_COPY,
} from "../config/reservas.constants";
import useReservationDetail from "../hooks/useReservationDetail";
import { ReservationStatus } from "../Type/ReservaType";
import type { ReservationDetailModalProps } from "../Type/ReservaType";
import { formatRequestMoment } from "../utils/reservationFormat";
import styles from "./ReservationDetailModal.module.css";

/**
 * El detalle de una reserva. **Presentacional**: todo lo que sabe se lo dice
 * `useReservationDetail`; acá no hay ni una URL ni una regla de negocio.
 */

/** La clase CSS del badge según el estado. */
const getStatusClassName = (statusKey?: ReservationStatus | number) => {
  switch (Number(statusKey)) {
    case ReservationStatus.AWAITING_APPROVAL:
      return styles.statusW;
    case ReservationStatus.PENDING_PAYMENT:
      return styles.statusA;
    case ReservationStatus.PAYMENT_SUBMITTED:
      return styles.statusQ;
    case ReservationStatus.RESERVED_UNPAID:
      return styles.statusN;
    case ReservationStatus.RESERVED_PAID:
      return styles.statusL;
    case ReservationStatus.REJECTED:
      return styles.statusR;
    case ReservationStatus.CANCELLED_MANUAL:
      return styles.statusC;
    case ReservationStatus.CANCELLED_AUTO:
      return styles.statusT;
    case ReservationStatus.COMPLETED:
      return styles.statusF;
    case ReservationStatus.MAINTENANCE:
      return styles.statusM;
    default:
      return styles.statusUnknown;
  }
};

const ReservationDetailModal: React.FC<ReservationDetailModalProps> = memo(
  ({ open, onClose, item, reservationId, reLoad }) => {
    const detail = useReservationDetail({
      open,
      onClose,
      item,
      reservationId,
      reLoad,
    });

    return (
      <>
        <DataModal
          open={open}
          onClose={onClose}
          title={RESERVATION_DETAIL_COPY.title}
          buttonText=""
          buttonCancel=""
          minWidth={739}
          maxWidth={920}
          variant="mini"
        >
          <LoadingScreen
            onlyLoading={detail.isEmpty && open}
            type="CardSkeleton"
          >
            {detail.isEmpty ? (
              <div className={styles.container}>
                <div className={styles.notFoundContainer}>
                  <p className={styles.notFoundText}>
                    {RESERVATION_DETAIL_COPY.notFound}
                  </p>
                  <p className={styles.notFoundSuggestion}>
                    {RESERVATION_DETAIL_COPY.notFoundSuggestion}
                  </p>
                </div>
              </div>
            ) : (
              <div className={styles.modalContent}>
                <div className={styles.summaryCard}>
                  <div className={styles.summaryTop}>
                    <div className={styles.summaryIdentity}>
                      {detail.isMaintenance ? (
                        <div className={styles.systemBadge}>ADM</div>
                      ) : (
                        <Avatar
                          src={detail.reservationDetail?.owner?.url_avatar || ""}
                          name={detail.ownerName}
                          w={48}
                          h={48}
                        />
                      )}

                      <div className={styles.summaryText}>
                        <p className={styles.summaryEyebrow}>
                          {detail.isMaintenance
                            ? RESERVATION_DETAIL_COPY.maintenanceEyebrow
                            : RESERVATION_DETAIL_COPY.requesterEyebrow}
                        </p>
                        <h3 className={styles.summaryTitle}>
                          {detail.isMaintenance
                            ? RESERVATION_DETAIL_COPY.maintenanceOwner
                            : detail.ownerName}
                        </h3>
                        <p className={styles.summarySubtitle}>
                          {detail.isMaintenance
                            ? detail.approvalValue ||
                              "Registrado por administración"
                            : `${detail.dptoLabel} · ${formatRequestMoment(
                                detail.reservationDetail?.created_at,
                              )}`}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`${styles.statusBadge} ${getStatusClassName(
                        detail.statusKey ??
                          Number(detail.reservationDetail?.status),
                      )}`}
                    >
                      {detail.currentStatus?.label ||
                        RESERVATIONS_COPY.unknownStatus}
                    </span>
                  </div>

                  <div className={styles.areaSummary}>
                    <p className={styles.summaryEyebrow}>
                      {RESERVATION_DETAIL_COPY.areaEyebrow}
                    </p>
                    <h4 className={styles.areaTitle}>{detail.areaName}</h4>
                    {detail.reservationDetail?.area?.description ? (
                      <p className={styles.areaDescription}>
                        {detail.reservationDetail.area.description}
                      </p>
                    ) : null}
                  </div>

                  {detail.showTimeLimit ? (
                    <div className={styles.timeLimitAlert}>
                      {detail.formattedTimeLimit}
                    </div>
                  ) : null}

                  <div className={styles.infoGrid}>
                    {detail.detailRows.map((row) => (
                      <div key={row.label} className={styles.infoItem}>
                        <span className={styles.infoLabel}>{row.label}</span>
                        <span className={styles.infoValue}>{row.value}</span>
                      </div>
                    ))}
                  </div>

                  {detail.detailNotes.length > 0 ? (
                    <div className={styles.noteStack}>
                      {detail.detailNotes.map((note) => (
                        <div key={note.label} className={styles.noteBlock}>
                          <p className={styles.noteLabel}>{note.label}</p>
                          <p className={styles.noteValue}>{note.value}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                {detail.actionError ? (
                  <div className={styles.errorBox}>
                    Error: {detail.actionError}
                  </div>
                ) : null}

                {detail.canReviewRequest ? (
                  <div className={styles.actionButtonsContainer}>
                    <Button
                      className={styles.secondaryActionButton}
                      onClick={detail.openRejectModal}
                      variant="secondary"
                      disabled={detail.isActionLoading}
                    >
                      {RESERVATION_DETAIL_COPY.reject}
                    </Button>
                    <Button
                      className={styles.primaryActionButton}
                      onClick={detail.approveReservation}
                      variant="primary"
                      disabled={detail.isActionLoading}
                    >
                      {RESERVATION_DETAIL_COPY.approve}
                    </Button>
                  </div>
                ) : null}

                {!detail.canReviewRequest &&
                (detail.canCancelReservation || detail.canShowPayment) ? (
                  <div className={styles.actionButtonsContainer}>
                    {detail.canCancelReservation ? (
                      <Button
                        className={styles.secondaryActionButton}
                        onClick={detail.openCancelModal}
                        variant="secondary"
                        disabled={detail.isActionLoading}
                      >
                        {RESERVATION_DETAIL_COPY.cancel}
                      </Button>
                    ) : null}

                    {detail.canShowPayment ? (
                      <Button
                        className={styles.primaryActionButton}
                        onClick={detail.openPaymentModal}
                        variant="primary"
                      >
                        {RESERVATION_DETAIL_COPY.viewPayment}
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )}
          </LoadingScreen>
        </DataModal>

        {detail.showPaymentModal ? (
          <PaymentRenderView
            open={detail.showPaymentModal}
            onClose={detail.handlePaymentModalClose}
            reLoad={detail.handleReservationDetailReload}
            payment_id={detail.resolvedPaymentId as string | number}
            noWaiting={true}
          />
        ) : null}

        {detail.openModalCancel ? (
          <DataModal
            title="Cancelar reserva"
            open={detail.openModalCancel}
            buttonText={RESERVATION_DETAIL_COPY.cancel}
            buttonCancel="Salir"
            onClose={detail.closeCancelModal}
            minWidth={686}
            maxWidth={760}
            onSave={detail.cancelReservation}
          >
            <div className={styles.modalBody}>
              <p className={styles.modalParagraph}>
                Indica el motivo por el cual quieres cancelar esta reserva.
              </p>
              <Input
                label="Motivo"
                name="reason"
                value={detail.cancelReason}
                onChange={(event: any) =>
                  detail.changeCancelReason(event.target.value)
                }
                required
                error={detail.cancelErrors}
              />
            </div>
          </DataModal>
        ) : null}

        {detail.isRejectModalOpen ? (
          <DataModal
            open={detail.isRejectModalOpen}
            onClose={detail.closeRejectModal}
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
                value={detail.rejectionReason}
                onChange={(event: any) =>
                  detail.changeRejectionReason(event.target.value)
                }
                placeholder="Escribe aquí por qué se rechaza la reserva..."
                required
                aria-invalid={!!detail.rejectErrors.reason}
                aria-describedby={
                  detail.rejectErrors.reason
                    ? "rejection-error-message"
                    : undefined
                }
              />
              {detail.rejectErrors.reason ? (
                <span
                  id="rejection-error-message"
                  className={styles.rejectErrorMessage}
                >
                  {detail.rejectErrors.reason}
                </span>
              ) : null}
            </div>

            <div
              className={`${styles.actionButtonsContainer} ${styles.rejectActions}`}
            >
              <Button
                className={styles.secondaryActionButton}
                onClick={detail.closeRejectModal}
                variant="secondary"
                disabled={detail.isActionLoading}
              >
                Salir
              </Button>
              <Button
                className={styles.primaryActionButton}
                onClick={detail.rejectReservation}
                variant="primary"
                disabled={detail.isActionLoading}
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
