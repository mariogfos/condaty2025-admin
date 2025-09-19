import React, { useState } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Button from "@/mk/components/forms/Button/Button";
import { formatNumber } from "@/mk/utils/numbers";
import { getDateStrMes } from "@/mk/utils/date";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import styles from "./BudgetDirApprovalModal.module.css";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar"; // <- Agregar import

const formatPeriod = (periodCode: string): string => {
  const map: Record<string, string> = {
    M: "Mensual",
    Q: "Trimestral",
    B: "Semestral",
    Y: "Anual",
  };
  return map[periodCode] || periodCode;
};

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
}

const getStatusConfig = (status: string): StatusConfig => {
  const statusConfig: Record<string, StatusConfig> = {
    D: {
      label: "Borrador",
      color: "var(--cInfo)",
      bgColor: "var(--cHoverCompl3)",
    },
    P: {
      label: "Pendiente por aprobar",
      color: "var(--cWarning)",
      bgColor: "var(--cHoverCompl4)",
    },
    A: {
      label: "Aprobado",
      color: "var(--cSuccess)",
      bgColor: "var(--cHoverCompl2)",
    },
    R: {
      label: "Rechazado",
      color: "var(--cError)",
      bgColor: "var(--cHoverError)",
    },
    C: {
      label: "Completado",
      color: "var(--cSuccess)",
      bgColor: "var(--cHoverCompl2)",
    },
    X: {
      label: "Cancelado",
      color: "var(--cWhite)",
      bgColor: "var(--cHoverCompl1)",
    },
  };

  return (
    statusConfig[status] || {
      label: "No disponible",
      color: "var(--cWhite)",
      bgColor: "var(--cHoverCompl1)",
    }
  );
};

type BudgetApprovalViewProps = {
  open: boolean;
  onClose: () => void;
  item: any;
  execute: (
    url: string,
    method: string,
    payload: any,
    noWaiting?: boolean,
    noGenericError?: boolean
  ) => Promise<{ data?: any; error?: any }>;
  reLoad: () => void;
  showToast: (
    message: string,
    type: "success" | "error" | "warning" | "info"
  ) => void;
  extraData?: any;
};

const BudgetApprovalView: React.FC<BudgetApprovalViewProps> = ({
  open,
  onClose,
  item,
  execute,
  reLoad,
  showToast,
  extraData,
}) => {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState(""); // <- Agregar estado para error

  const handleAction = async (newStatus: "A" | "R") => {
    const isLoadingSetter = newStatus === "A" ? setIsApproving : setIsRejecting;
    const actionText = newStatus === "A" ? "aprobado" : "rechazado";

    // <- Validación del comentario
    if (newStatus === "R" && (!comment || comment.trim() === "")) {
      setCommentError(
        "El comentario es obligatorio para rechazar un presupuesto"
      );
      showToast("El comentario es obligatorio para rechazar", "warning");
      return;
    }

    // Limpiar error si la validación pasa
    setCommentError("");

    const budgetId = item?.id;
    if (!budgetId) {
      showToast("Error: No se encontró el ID del presupuesto.", "error");
      return;
    }

    isLoadingSetter(true);
    try {
      const payload = {
        status: newStatus,
        id: budgetId,
        comment: comment || "",
      };
      const url = "/change-budget";

      const { data: response } = await execute(
        url,
        "POST",
        payload,
        false,
        true
      );

      const toastType: "success" | "info" =
        newStatus === "A" ? "success" : "info";
      showToast(
        response?.message || `Presupuesto ${actionText} correctamente.`,
        toastType
      );

      reLoad();
      onClose();
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        `Ocurrió un error al ${actionText}.`;
      showToast(errorMessage, "error");
      console.error(`Error on budget ${actionText}:`, err);
    } finally {
      isLoadingSetter(false);
    }
  };

  const handleApprove = () => handleAction("A");
  const handleReject = () => handleAction("R");
  const handleCloseModal = () => {
    onClose();
  };

  // <- Función para manejar cambios en el comentario y limpiar errores
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
    if (commentError) {
      setCommentError(""); // Limpiar error cuando el usuario empiece a escribir
    }
  };

  const statusConfig = getStatusConfig(item?.status);

  return (
    <DataModal
      open={open}
      onClose={handleCloseModal}
      title="Detalle del presupuesto"
      buttonText="Aprobar"
      buttonCancel=""
      onSave={handleApprove}
      disabled={isApproving || isRejecting} // <- Deshabilitar botón mientras se procesa
      buttonExtra={
        <Button
          variant="secondary"
          onClick={handleReject}
          disabled={isApproving || isRejecting}
        >
          Rechazar
        </Button>
      }
    >
      <div className={styles.container}>
        {/* Header Section - Centrado con Avatar */}
        <div className={styles.headerSection}>
          <Avatar
            hasImage={item?.user?.has_image}
            src={getUrlImages(
              "/ADM-" + item?.user?.id + ".webp?d=" + item?.user?.updated_at
            )}
            h={60}
            w={60}
            // <- Quitar style={{ borderRadius: 16 }} ya que el Avatar maneja esto internamente
            name={getFullName(item?.user)}
          />
          <div className={styles.createdBy}>
            Creado por: {getFullName(item?.user) || "Sistema"}
            <div className={styles.userRole}>Administrador principal</div>
          </div>
        </div>

        <hr className={styles.sectionDivider} />

        {/* Details Section - Dos columnas como en Payments */}
        <section className={styles.detailsSection}>
          <div className={styles.detailsColumn}>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Monto presupuestado</span>
              <span className={styles.infoValue}>
                {formatNumber(item?.amount)}
              </span>
            </div>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Fecha inicio</span>
              <span className={styles.infoValue}>
                09:00 - {getDateStrMes(item?.start_date)}
              </span>
            </div>
            {/* <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Subcategoría</span>
              <span className={styles.infoValue}>
                {item?.category?.name || "N/A"}
              </span>
            </div> */}
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Período</span>
              <span className={styles.infoValue}>
                {formatPeriod(item?.period)}
              </span>
            </div>
          </div>

          <div className={styles.detailsColumn}>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Estado</span>
              <div style={{ color: statusConfig.color }}>
                {statusConfig.label}
              </div>
            </div>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Fecha fin</span>
              <span className={styles.infoValue}>
                {getDateStrMes(item?.end_date)}
              </span>
            </div>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Subcategoría</span>
              <span className={styles.infoValue}>{item.category?.name}</span>
            </div>
          </div>
        </section>

        <hr className={styles.sectionDivider} />

        {/* Resumen Section - Tabla como en la imagen */}
        <div className={styles.periodsDetailsSection}>
          <div className={styles.periodsDetailsHeader}>
            <h3 className={styles.periodsDetailsTitle}>Resumen</h3>
          </div>

          <div className={styles.periodsTableWrapper}>
            <div className={styles.periodsTable}>
              <div className={styles.periodsTableHeader}>
                <div className={styles.periodsTableCell}>Item</div>
                <div className={styles.periodsTableCell}>Subcategoría</div>
                <div className={styles.periodsTableCell}>Subtotal</div>
              </div>
              <div className={styles.periodsTableBody}>
                <div className={styles.periodsTableRow}>
                  <div className={styles.periodsTableCell} data-label="Item">
                    {item.name}
                  </div>
                  <div
                    className={styles.periodsTableCell}
                    data-label="Categoría"
                  >
                    {item.category?.name}
                  </div>
                  <div
                    className={styles.periodsTableCell}
                    data-label="Subtotal"
                  >
                    Bs {formatNumber(item?.amount)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comentario con validación */}
        <div style={{ marginTop: "15px", marginBottom: "15px" }}>
          <TextArea
            label="Comentario"
            name="comment"
            value={comment}
            onChange={handleCommentChange} // <- Usar la nueva función
            placeholder="Ingrese un comentario..."
            error={commentError ? { comment: commentError } : {}} // <- Mostrar error
            required={false} // Opcional por defecto
          />
        </div>
      </div>
    </DataModal>
  );
};

export default BudgetApprovalView;
