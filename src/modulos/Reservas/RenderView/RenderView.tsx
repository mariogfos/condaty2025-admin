"use client";
import React, { memo } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Button from "@/mk/components/forms/Button/Button";
import useAxios from "@/mk/hooks/useAxios";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import {
  format,
  parseISO,
  formatDistanceToNowStrict,
  format as formatDateFns,
} from "date-fns";
import { es } from "date-fns/locale";
import styles from "./ReservationDetailModal.module.css";
import {
  IconCalendar,
  IconClock,
  IconCash,
  IconGroup,
} from "@/components/layout/icons/IconsBiblioteca";
import Input from "@/mk/components/forms/Input/Input";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import { useAuth } from "@/mk/contexts/AuthProvider";
import LoadingScreen from "@/mk/components/ui/LoadingScreen/LoadingScreen";
import {
  RESERVATION_STATUS_CONFIG,
  getUpdatedReservationStatus,
  type ReservationStatus,
} from "../constants/reservationConstants";

interface ReservationItem {
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
  approved_by?: string;
  canceled_by?: string | null;
  canceled_at?: string | null;
  is_canceled?: string;
  obs?: string;
  reason?: string;
  start_time?: string;
  end_time?: string;
  status?: ReservationStatus;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  periods?: any[];
  area?: any;
  dpto?: any;
  owner?: any;
}

interface ReservationDetailModalProps {
  open: boolean;
  onClose: () => void;
  item?: ReservationItem | Record<string, any>;
  reservationId?: string | number | null;
  reLoad?: () => void;
}

const ReservationDetailModal: React.FC<ReservationDetailModalProps> = memo(
  ({ open, onClose, item, reservationId, reLoad }) => {
    const { showToast } = useAuth();

    // Usar useAxios como hook directo, similar al componente de DebtsManager
    const { data } = useAxios(
      "/reservations",
      "GET",
      {
        fullType: "DET",
        searchBy: reservationId || item?.id,
        page: 1,
        perPage: 1,
      },
      open && (!!reservationId || !!item?.id) // Solo ejecutar si el modal está abierto y tenemos un ID
    );

    // Usar los datos de la consulta DET si están disponibles, sino usar el item original
    const reservationDetail = data?.data || item || {};

    const { execute: executeAction } = useAxios();

    const [isActionLoading, setIsActionLoading] = React.useState(false);
    const [actionError, setActionError] = React.useState<string | null>(null);
    const [isRejectModalOpen, setIsRejectModalOpen] = React.useState(false);
    const [rejectionReason, setRejectionReason] = React.useState("");
    const [rejectErrors, setRejectErrors] = React.useState<any>({});
    const [openModalCancel, setOpenModalCancel] = React.useState(false);
    const [formState, setFormState] = React.useState<any>({});
    const [errors, setErrors] = React.useState({});

    const getFormattedRequestTime = (isoDate: string): string => {
      if (!isoDate) return "Fecha inválida";
      try {
        return formatDistanceToNowStrict(parseISO(isoDate), {
          addSuffix: true,
          locale: es,
        });
      } catch {
        return "Fecha inválida";
      }
    };

    const getFormattedReservationDate = (dateStr: string): string => {
      if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr))
        return "Fecha inválida";
      try {
        const date = parseISO(dateStr + "T00:00:00");
        return format(date, "EEEE, d 'de' MMMM", { locale: es });
      } catch {
        return "Fecha inválida";
      }
    };

    const getFormattedReservationTime = (
      periods: any[] | undefined | null
    ): string => {
      if (!periods || periods.length === 0) return "Horario no especificado";
      try {
        const validPeriods = Array.isArray(periods) ? periods : [];
        const sortedPeriods = [...validPeriods].sort((a, b) =>
          (a.time_from || "").localeCompare(b.time_from || "")
        );
        const formattedPeriodStrings = sortedPeriods.map((period) => {
          const startTime = (period.time_from || "00:00:00").substring(0, 5);
          const endTime = (period.time_to || "00:00:00").substring(0, 5);
          return `${startTime} - ${endTime}`;
        });
        return formattedPeriodStrings.join(" / ");
      } catch (error) {
        console.error("Error formateando horario de reserva:", error);
        return "Horario inválido";
      }
    };

    const getPriceDetails = (
      area: any | undefined | null,
      totalAmount: string | number | undefined | null
    ): string => {
      const safeTotalAmount = totalAmount ?? 0;
      if (!area) return "Detalles de precio no disponibles";

      const price = parseFloat(area.price);
      const total = parseFloat(String(safeTotalAmount));

      if (isNaN(price)) return "Precio base inválido";
      if (isNaN(total)) return "Monto total inválido";

      const isFreeExplicit = area.is_free === "A";
      const isPriceZero = price <= 0;

      if (isFreeExplicit || isPriceZero) {
        if (total > 0) {
          return `Gratis - Total: Bs ${total.toFixed(2)}`;
        } else {
          return "Gratis";
        }
      } else {
        return `Bs ${price.toFixed(2)}`;
      }
    };

    const getStatusInfo = (status?: ReservationStatus) => {
      // Usar la función utilitaria para obtener el estado actualizado
      const currentStatus = getUpdatedReservationStatus(
        status,
        reservationDetail?.date_end,
        reservationDetail?.end_time
      );

      return currentStatus ? RESERVATION_STATUS_CONFIG[currentStatus] : null;
    };

    // --- Handlers de Acción ---
    const handleAcceptClick = async () => {
      if (!reservationDetail?.id || isActionLoading) return;
      setIsActionLoading(true);
      setActionError(null);
      const now = new Date();
      const formattedDate = formatDateFns(now, "yyyy-MM-dd HH:mm:ss");
      const payload = {
        approved_at: formattedDate,
        is_approved: "Y",
        obs: "Aprobado",
      };
      try {
        await executeAction(
          `/reservations/${reservationDetail.id}`,
          "PUT",
          payload,
          false,
          false
        );
        if (reLoad) reLoad();
        onClose();
      } catch (error: any) {
        setActionError(
          error?.response?.data?.message ||
            error?.message ||
            "Ocurrió un error al aprobar."
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

      const payload = { is_approved: "N", reason: rejectionReason.trim() };

      try {
        await executeAction(
          `/reservations/${reservationDetail.id}`,
          "PUT",
          payload,
          false,
          false
        );

        setIsRejectModalOpen(false);
        onClose();
        if (reLoad) reLoad();
      } catch (error: any) {
        setActionError(
          error?.response?.data?.message ||
            error?.message ||
            "Ocurrió un error al rechazar."
        );
        setIsRejectModalOpen(false);
      } finally {
        setIsActionLoading(false);
      }
    };

    const handleChangeInput = (e: any) => {
      let value = e.target.value;
      setFormState({ ...formState, [e.target.name]: value });
    };

    const validateReason = () => {
      let errs: any = {};
      errs = checkRules({
        value: formState.reason,
        rules: ["required"],
        key: "reason",
        errors: errs,
      });

      setErrors(errs);
      return errs;
    };

    const onSaveCancel = async () => {
      if (hasErrors(validateReason())) return;
      const { data } = await executeAction(
        "/reservations/" + reservationDetail?.id,
        "PUT",
        {
          status: "C",
          reason: formState?.reason,
        }
      );
      if (data?.success) {
        setOpenModalCancel(false);
        showToast(data?.message || "Reserva cancelada", "success");
        onClose();
        if (reLoad) reLoad();
      } else {
        showToast(data?.message || "Ocurrió un error", "error");
      }
    };

    const currentStatus = getStatusInfo(reservationDetail?.status);

    return (
      <>
        <DataModal
          open={open}
          onClose={onClose}
          title="Detalle de la reserva"
          buttonText=""
          buttonCancel=""
          style={{ width: "739px", maxWidth: "80%" }}
          variant={"mini"}
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
                    Por favor, verifica los detalles o intenta de nuevo más
                    tarde.
                  </p>
                </div>
              </div>
            ) : (
              <div className={styles.modalContent}>
                {(() => {
                  // Obtener el estado actualizado para la lógica de cancelación
                  const updatedStatus = getUpdatedReservationStatus(
                    reservationDetail.status,
                    reservationDetail?.date_end,
                    reservationDetail?.end_time
                  );

                  const canCancel =
                    updatedStatus &&
                    ["R", "C", "T", "F", "X"].includes(updatedStatus) ===
                      false;
                  return (
                    canCancel && (
                      <p
                        onClick={() => setOpenModalCancel(true)}
                        style={{
                          color: "var(--cError)",
                          textAlign: "right",
                          textDecorationLine: "underline",
                          cursor: "pointer",
                        }}
                      >
                        Cancelar reserva
                      </p>
                    )
                  );
                })()}

                <div className={styles.reservationBlock}>
                  <div className={styles.requesterSection}>
                    <div className={styles.requesterInfoContainer}>
                      <Avatar
                        hasImage={1}
                        src={getUrlImages(
                          `/OWNER-${reservationDetail.owner?.id}.webp?d=${reservationDetail.owner?.updated_at}`
                        )}
                        name={getFullName(reservationDetail.owner)}
                        w={40}
                        h={40}
                      />
                      <div className={styles.requesterText}>
                        <span className={styles.requesterName}>
                          {getFullName(reservationDetail.owner)}
                        </span>
                        {reservationDetail.dpto && (
                          <span className={styles.requesterApt}>
                            Dpto:{" "}
                            {reservationDetail.dpto.nro ||
                              reservationDetail.dpto.description ||
                              "-"}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={styles.requestTime}>
                      Solicitado:{" "}
                      {reservationDetail.created_at
                        ? getFormattedRequestTime(reservationDetail.created_at)
                        : ""}
                    </span>
                  </div>
                  <hr className={styles.areaSeparator} />

                  <div className={styles.mainDetailsContainer}>
                    <div className={styles.detailsColumn}>
                      <div className={styles.specificDetails}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span className={styles.detailsHeader}>
                            Área social: {reservationDetail?.area?.title}
                          </span>
                          <div
                            className={`${styles.statusBadge} ${
                              currentStatus
                                ? styles[currentStatus.class]
                                : styles.statusUnknown
                            }`}
                          >
                            {currentStatus
                              ? currentStatus.label
                              : "Estado desconocido"}
                          </div>
                        </div>
                        <div className={styles.detailsList}>
                          <div className={styles.detailItem}>
                            <IconCalendar
                              size={18}
                              className={styles.detailIcon}
                            />
                            <span className={styles.detailText}>
                              {reservationDetail.date_at
                                ? getFormattedReservationDate(
                                    reservationDetail.date_at
                                  )
                                : ""}
                            </span>
                          </div>
                          <div className={styles.detailItem}>
                            <IconClock
                              size={18}
                              className={styles.detailIcon}
                            />
                            <span className={styles.detailText}>
                              {getFormattedReservationTime(
                                reservationDetail.periods
                              )}
                            </span>
                          </div>
                          <div className={styles.detailItem}>
                            <IconGroup
                              size={18}
                              className={styles.detailIcon}
                            />
                            <span className={styles.detailText}>
                              {reservationDetail.people_count ?? 0} persona
                              {reservationDetail.people_count !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className={styles.detailItem}>
                            <IconCash size={18} className={styles.detailIcon} />
                            <span className={styles.priceDetailText}>
                              {getPriceDetails(
                                reservationDetail.area,
                                reservationDetail.amount
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {actionError && (
                  <div
                    className={styles.errorText}
                    style={{
                      color: "red",
                      marginTop: "10px",
                      textAlign: "center",
                      padding: "5px",
                      border: "1px solid red",
                      borderRadius: "4px",
                    }}
                  >
                    Error: {actionError}
                  </div>
                )}

                {reservationDetail.status === "W" && (
                  <div className={styles.actionButtonsContainer}>
                    <Button
                      onClick={handleRejectClick}
                      variant="secondary"
                      disabled={isActionLoading}
                      className={styles.rejectButtonProportional}
                    >
                      Rechazar solicitud
                    </Button>
                    <Button
                      onClick={handleAcceptClick}
                      variant="primary"
                      disabled={isActionLoading}
                      className={styles.approveButtonProportional}
                    >
                      Aprobar solicitud
                    </Button>
                  </div>
                )}
              </div>
            )}
          </LoadingScreen>
        </DataModal>

        {openModalCancel && (
          <DataModal
            title="Cancelar reserva"
            open={openModalCancel}
            buttonText="Cancelar reserva"
            buttonCancel="Salir"
            onClose={() => setOpenModalCancel(false)}
            style={{ width: "686px" }}
            onSave={onSaveCancel}
          >
            <p style={{ marginBottom: 16 }}>
              Por favor, indica el motivo por el cual quieres cancelar esta
              reserva.
            </p>
            <Input
              label="Motivo"
              name="reason"
              value={formState?.reason}
              onChange={handleChangeInput}
              required
              error={errors}
            />
          </DataModal>
        )}

        {isRejectModalOpen && (
          <DataModal
            open={isRejectModalOpen}
            onClose={() => {
              setIsRejectModalOpen(false);
              setRejectErrors({});
            }}
            title="Rechazar solicitud"
            buttonText=""
            buttonCancel=""
            style={{ width: "486px", maxWidth: "80%" }}
          >
            <div className={styles.divider}></div>
            <div className={styles.modalContentContainer}>
              <p>
                Por favor indica el motivo para que el residente pueda
                comprender e intente solicitar esta área social de manera
                correcta
              </p>
              <Input
                name="reason"
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
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
              {rejectErrors.reason && (
                <span
                  id="rejection-error-message"
                  style={{
                    color: "var(--cError, #e46055)",
                    fontSize: "12px",
                    marginTop: "4px",
                  }}
                >
                  {rejectErrors.reason}
                </span>
              )}
            </div>

            <div
              className={styles.actionButtonsContainer}
              style={{ marginTop: "var(--spL, 16px)" }}
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
                Confirmar Rechazo
              </Button>
            </div>
          </DataModal>
        )}
      </>
    );
  }
);

ReservationDetailModal.displayName = "ReservationDetailModal";

export default ReservationDetailModal;
