"use client";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { formatNumber } from "@/mk/utils/numbers";
import { getDateStrMes } from "@/mk/utils/date";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar"; // <- Agregar import
import styles from "./RenderView.module.css";

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

const RenderView = (props: any) => {
  const { open, onClose, item } = props;

  if (!item) {
    return (
      <DataModal
        open={open}
        onClose={onClose}
        title={"Detalle del presupuesto"}
        buttonText=""
        buttonCancel=""
        style={{ width: "max-content" }}
        className={styles.renderView}
      >
        <div className="flex justify-center items-center h-40">
          <span>No se encontró información del presupuesto</span>
        </div>
      </DataModal>
    );
  }

  const statusConfig = getStatusConfig(item?.status);

  return (
    <DataModal
      open={open}
      onClose={onClose}
      title={"Detalle del presupuesto"}
      buttonText=""
      buttonCancel=""
      style={{ width: "max-content" }}
      className={styles.renderView}
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

        {/* Details Section - Dos columnas como en BudgetDir */}
        <section className={styles.detailsSection}>
          <div className={styles.detailsColumn}>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Nombre</span>
              <span className={styles.infoValue}>{item?.name}</span>
            </div>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Monto presupuestado</span>
              <span className={styles.infoValue}>
                Bs {formatNumber(item?.amount)}
              </span>
            </div>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Fecha inicio</span>
              <span className={styles.infoValue}>
                {getDateStrMes(item?.start_date) || "No disponible"}
              </span>
            </div>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Subcategoría</span>
              <span className={styles.infoValue}>
                {item?.category?.name || "No disponible"}
              </span>
            </div>
          </div>

          <div className={styles.detailsColumn}>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Estado</span>
              <div style={{color: statusConfig.color}}>
                {statusConfig.label}
              </div>
            </div>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Período</span>
              <span className={styles.infoValue}>
                {formatPeriod(item?.period)}
              </span>
            </div>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Fecha fin</span>
              <span className={styles.infoValue}>
                {getDateStrMes(item?.end_date) || "No disponible"}
              </span>
            </div>
            {item?.approved && (
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Aprobado por</span>
                <span className={styles.infoValue}>
                  {getFullName(item?.approved)}
                </span>
              </div>
            )}
          </div>
        </section>
      </div>
    </DataModal>
  );
};

export default RenderView;
