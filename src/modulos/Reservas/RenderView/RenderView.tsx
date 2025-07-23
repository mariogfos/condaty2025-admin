"use client";
import React, { useState, useEffect } from "react";
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
// Eliminado import de TextArea si no se usa directamente en ReservationDetailModal
import Input from "@/mk/components/forms/Input/Input";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";

interface ReservationDetailsViewProps {
  details: any; // El objeto displayedData
  isActionLoading: boolean;
  actionError: string | null;
  onAcceptClick: () => void; // Función para manejar el clic en Aceptar
  onRejectClick: () => void; // Función para manejar el clic en Rechazar
  onCancel: () => void;
  getFormattedRequestTime: (isoDate: string) => string;
  getFormattedReservationDate: (dateStr: string) => string;
  getFormattedReservationTime: (periods: any[] | undefined | null) => string;
  getPriceDetails: (
    area: any | undefined | null,
    totalAmount: string
  ) => string;
}
const statusMap: any = {
  W: { label: "Por confirmar", class: styles.statusW },
  A: { label: "Reservado", class: styles.statusA },
  X: { label: "Rechazado", class: styles.statusX },
  C: { label: "Cancelado", class: styles.statusC },
  F: { label: "Completado", class: styles.statusF },
};

// 2. El componente funcional que contiene la vista de detalles
const ReservationDetailsView: React.FC<ReservationDetailsViewProps> = ({
  details,
  isActionLoading,
  actionError,
  onAcceptClick,
  onRejectClick,
  getFormattedRequestTime,
  getFormattedReservationDate,
  getFormattedReservationTime,
  getPriceDetails,
  onCancel,
}) => {
  // const { data } = useAxios("/reservations/" + details?.id, "PUT", {
  //   status: "C",
  // });
  // reservations/9ed1fe1a-511e-4b0a-9368-14e48a33e55f
  if (!details) return;
  let status = details?.status as "W" | "A" | "X" | "C" | "F" | undefined;
  let dateEnd = new Date(details?.date_end + "T" + details?.end_time)
    .toISOString()
    .split(".")[0];

  if (status === "A" && dateEnd < new Date().toISOString().split(".")[0]) {
    status = "F";
  }
  const currentStatus = status ? statusMap[status] : null;
  return (
    <>
      {status == "A" && (
        <p
          onClick={onCancel}
          style={{
            color: "var(--cError)",
            textAlign: "right",
            textDecorationLine: "underline",
            cursor: "pointer",
          }}
        >
          Cancelar reserva
        </p>
      )}
      <div className={styles.reservationBlock}>
        <div className={styles.requesterSection}>
          <div className={styles.requesterInfoContainer}>
            <Avatar
              hasImage={details.owner?.has_image}
              src={getUrlImages(
                `/OWNER-${details.owner.id}.webp?d=${details.owner.updated_at}`
              )}
              name={getFullName(details.owner)}
              w={40}
              h={40}
            />
            <div className={styles.requesterText}>
              <span className={styles.requesterName}>
                {getFullName(details.owner)}
              </span>
              {details.dpto && (
                <span className={styles.requesterApt}>
                  Dpto: {details.dpto.nro || details.dpto.description || "-"}
                </span>
              )}
            </div>
          </div>
          {/* Usa la función pasada por props */}
          <span className={styles.requestTime}>
            {details.created_at
              ? getFormattedRequestTime(details.created_at)
              : ""}
          </span>
        </div>
        <hr className={styles.areaSeparator} />

        <div className={styles.mainDetailsContainer}>
          <div className={styles.imageWrapper}>
            {details.area?.images?.length > 0 ? (
              <img
                // Consider using next/image for better performance and optimization
                src={getUrlImages(
                  `/AREA-${details.area.id}-${details.area.images[0].id}.${
                    details.area.images[0].ext
                  }?d=${details.area.updated_at || Date.now()}`
                )}
                alt={`Imagen de ${details.area.title}`}
                className={styles.areaImage}
                onError={(e: any) => {
                  e.currentTarget.src = "/placeholder-image.png";
                }} // Considera un placeholder local
              />
            ) : (
              <div className={`${styles.areaImage} ${styles.imagePlaceholder}`}>
                <span className={styles.imagePlaceholderText}>Sin Imagen</span>
              </div>
            )}
          </div>

          <div className={styles.detailsColumn}>
            <div className={styles.areaTextInfo}>
              <span className={styles.areaTitle}>
                {details.area?.title ?? "Área desconocida"}
              </span>
              <span className={styles.areaDescription}>
                {details.area?.description ?? "Sin descripción"}
              </span>
            </div>

            <hr className={styles.areaSeparator} />
            <div className={styles.specificDetails}>
              <span className={styles.detailsHeader}>
                Detalles de la Reserva
              </span>
              <div className={styles.detailsList}>
                <div className={styles.detailItem}>
                  <IconCalendar size={18} className={styles.detailIcon} />
                  {/* Usa la función pasada por props */}
                  <span className={styles.detailText}>
                    {details.date_at
                      ? getFormattedReservationDate(details.date_at)
                      : ""}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <IconClock size={18} className={styles.detailIcon} />
                  {/* Usa la función pasada por props */}
                  <span className={styles.detailText}>
                    {getFormattedReservationTime(details.periods)}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <IconGroup size={18} className={styles.detailIcon} />
                  <span className={styles.detailText}>
                    {details.people_count ?? 0} persona
                    {details.people_count !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <IconCash size={18} className={styles.detailIcon} />
                  <span className={styles.priceDetailText}>
                    {getPriceDetails(details.area, details.amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          className={`${styles.statusBadge} ${
            currentStatus ? currentStatus.class : styles.statusUnknown
          }`}
        >
          {currentStatus ? currentStatus.label : "Estado desconocido"}
        </div>
      </div>

      {/* Muestra el error de acción */}
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

      {details.status === "W" && (
        <div className={styles.actionButtonsContainer}>
          <Button
            onClick={onRejectClick}
            variant="secondary"
            disabled={isActionLoading}
            // --- USA ESTA NUEVA CLASE ---
            className={styles.rejectButtonProportional} // Para 3 partes
          >
            Cancelar solicitud
          </Button>
          <Button
            onClick={onAcceptClick}
            variant="primary"
            disabled={isActionLoading}
            // --- USA ESTA NUEVA CLASE ---
            className={styles.approveButtonProportional} // Para 5 partes
          >
            Aprobar Solicitud
          </Button>
        </div>
      )}
    </>
  );
};

const MemoizedReservationDetailsView = React.memo(ReservationDetailsView);
const ReservationDetailModal = ({
  open,
  onClose,
  item,
  reservationId,
  reLoad,
}: {
  open: boolean;
  onClose: () => void;
  item?: any | null;
  reservationId?: string | number | null;
  reLoad?: () => void;
}) => {
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [displayedData, setDisplayedData] = useState<any | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectErrors, setRejectErrors] = useState<any>({});
  const [openModalCancel, setOpenModalCancel] = useState(false);
  const [formState, setFormState]: any = useState({});
  const [errors, setErrors] = useState({});
  const {
    execute: fetchDetails,
    data: fetchedData,
    error: detailsError,
    loaded: detailsLoaded,
  } = useAxios();
  const { execute: executeAction } = useAxios();

  useEffect(() => {
    if (open) {
      setActionError(null);
      setIsActionLoading(false); // Resetear carga de acción al abrir/cambiar item
      setRejectErrors({}); // Limpiar errores de rechazo
      setRejectionReason(""); // Limpiar razón de rechazo

      if (item && item.id) {
        setDisplayedData(item);
      } else if (reservationId) {
        setDisplayedData(null);
        const paramsInitial = { fullType: "DET", searchBy: reservationId };
        fetchDetails(
          "/reservations",
          "GET",
          paramsInitial,
          true,
          false,
          paramsInitial
        );
      } else {
        setDisplayedData(null);
      }
    } else {
      setDisplayedData(null);
      setActionError(null);
      setIsActionLoading(false);
      setIsRejectModalOpen(false); // Asegurarse que el modal de rechazo también se cierre
      setRejectionReason("");
      setRejectErrors({});
    }
  }, [open, item, reservationId]); // Ejecutar si cambia la apertura, el item o el ID

  useEffect(() => {
    if (!item && detailsLoaded) {
      if (
        fetchedData?.data &&
        Array.isArray(fetchedData.data) &&
        fetchedData.data.length > 0
      ) {
        setDisplayedData(fetchedData.data[0]);
        setActionError(null);
      } else if (detailsError) {
        setDisplayedData(null);
        console.error("Error fetching details:", detailsError);
      } else {
        setDisplayedData(null);
      }
    }
  }, [fetchedData, detailsLoaded, detailsError, item]); // Dependencias clave

  // --- Funciones Auxiliares (se quedan en el padre y se pasan como props) ---
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
      const date = parseISO(dateStr + "T00:00:00"); // Asumir inicio del día
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
      // Asegurarse de que periods sea un array antes de ordenar
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
    const safeTotalAmount = totalAmount ?? 0; // Valor por defecto si es null/undefined
    if (!area) return "Detalles de precio no disponibles";

    // Convertir a número y validar
    const price = parseFloat(area.price);
    const total = parseFloat(String(safeTotalAmount)); // Convertir a string primero

    if (isNaN(price)) return "Precio base inválido"; // O manejar de otra forma
    if (isNaN(total)) return "Monto total inválido"; // O manejar de otra forma

    const isFreeExplicit = area.is_free === "A"; // Asumiendo 'X' significa gratis
    const isPriceZero = price <= 0;

    if (isFreeExplicit || isPriceZero) {
      // Si es explícitamente gratis O el precio es 0 o menos
      if (total > 0) {
        // Si aun así hay un total (quizás por otros cargos?), mostrarlo
        return `Gratis - Total: Bs ${total.toFixed(2)}`;
      } else {
        // Si no hay total o es 0, simplemente "Gratis"
        return "Gratis";
      }
    } else {
      return `Bs ${price.toFixed(2)}`;
    }
  };

  // --- Handlers de Acción ---
  const handleAcceptClick = async () => {
    if (!displayedData?.id || isActionLoading) return;
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
        `/reservations/${displayedData.id}`,
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
    // Solo abre el modal de rechazo, reseteando su estado interno
    if (!displayedData?.id) return;
    setRejectionReason("");
    setRejectErrors({});
    setIsRejectModalOpen(true);
  };

  const confirmRejection = async () => {
    if (!displayedData?.id || isActionLoading) return;

    if (!rejectionReason || rejectionReason.trim() === "") {
      setRejectErrors({ reason: "Debe ingresar un motivo para el rechazo." });
      return;
    }
    setRejectErrors({}); // Limpiar error si la validación pasa

    setIsActionLoading(true);
    setActionError(null); // Limpiar error principal por si acaso

    const payload = { is_approved: "N", reason: rejectionReason.trim() };

    try {
      await executeAction(
        `/reservations/${displayedData.id}`,
        "PUT",
        payload,
        false,
        false
      );

      setIsRejectModalOpen(false);
      onClose(); // Cierra el modal principal
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
      "/reservations/" + displayedData?.id,
      "PUT",
      {
        status: "C",
        reason: formState?.reason,
      }
    );
    if (data?.success == true) {
      setOpenModalCancel(false);
      onClose();
      if (reLoad) reLoad();
    }
  };
  return (
    <>
      <DataModal
        open={open}
        onClose={onClose}
        title="Detalle de la Reserva"
        buttonText=""
        buttonCancel=""
        style={{ width: "739px", maxWidth: "80%" }}
      >
        <div className={styles.modalContent}>
          <MemoizedReservationDetailsView
            details={displayedData}
            isActionLoading={isActionLoading} // Estado de carga de las *acciones* (Aprobar/Rechazar)
            actionError={actionError} // Error de las *acciones*
            onAcceptClick={handleAcceptClick}
            onRejectClick={handleRejectClick}
            getFormattedRequestTime={getFormattedRequestTime}
            getFormattedReservationDate={getFormattedReservationDate}
            getFormattedReservationTime={getFormattedReservationTime}
            onCancel={() => setOpenModalCancel(true)}
            getPriceDetails={getPriceDetails}
          />
        </div>
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
            Por favor indica el motivo por el cual quieres cancelar esta reserva
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
          title="Cancelar solicitud"
          buttonText="" // Sin botones por defecto
          buttonCancel="" // Sin botones por defecto
          style={{ width: "486px", maxWidth: "80%" }}
        >
          <div className={styles.divider}></div>
          <div className={styles.modalContentContainer}>
            {/* Contenedor para padding/gap interno */}
            <p>
              Por favor indica el motivo para que el residente pueda comprender
              e intente solicitar esta área social de manera correcta
            </p>
            <Input
              name="reason"
              value={rejectionReason}
              onChange={(e) => {
                setRejectionReason(e.target.value);
                // Limpiar error al empezar a escribir de nuevo
                if (rejectErrors.reason) {
                  setRejectErrors({});
                }
              }}
              placeholder="Escribe aquí por qué se rechaza la reserva..."
              required // Añade indicación visual si tu CSS lo soporta
              // Podrías añadir aria-invalid si hay error
              aria-invalid={!!rejectErrors.reason}
              aria-describedby={
                rejectErrors.reason ? "rejection-error-message" : undefined
              }
              // Considera usar <TextArea /> si el motivo puede ser largo
            />
            {/* Mensaje de error específico para el campo de motivo */}
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

          {/* Footer con botones de acción específicos para este modal */}
          <div
            className={styles.actionButtonsContainer}
            style={{ marginTop: "var(--spL, 16px)" }}
          >
            <Button
              className={styles.secondaryActionButton} // Clase para estilo (flex-grow: 1)
              onClick={() => setIsRejectModalOpen(false)} // Solo cierra este modal
              variant="secondary"
              disabled={isActionLoading} // Deshabilitar durante la acción
            >
              Salir
            </Button>
            {/* Botón primario (Confirmar Rechazo) */}
            <Button
              className={styles.primaryActionButton} // Clase para estilo (flex-grow: 2)
              onClick={confirmRejection} // Ejecuta la acción de rechazo
              variant="primary" // O el variant que corresponda al botón de confirmación
              disabled={isActionLoading} // Deshabilitar durante la acción
            >
              Confirmar cancelación
            </Button>
          </div>
        </DataModal>
      )}
    </>
  );
};

export default ReservationDetailModal;
