import DataModal from "@/mk/components/ui/DataModal/DataModal";
import styles from "./RenderView.module.css";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { lStatusActive } from "@/mk/utils/utils";
import { getDateStrMes, getDateTimeStrMesShort, MONTHS_S } from "@/mk/utils/date";
import Button from "@/mk/components/forms/Button/Button";
import { useState } from "react";

const RenderView = (props: {
  open: boolean;
  onClose: any;
  item: Record<string, any>;
  onConfirm?: Function;
  extraData?: any;
}) => {
  const [payDetails, setPayDetails] = useState(false);

  return (
    <DataModal
      open={props.open}
      onClose={props?.onClose}
      title="Detalle de alerta"
      buttonText=""
      buttonCancel=""
      style={{ width: "883px" }}
    >
      
      <div className={styles.container}>
      <div className={styles.divider}></div>
        {/* Imagen de seguridad/guardia */}
        <div className={styles.avatarSection}>
          <Avatar
            src={getUrlImages("/GUARD-" + props?.item?.guard_id + ".webp?d=" + props?.item?.guardia.updated_at)}
            name={props?.item?.guard_name || "Guardia"}
            w={100}
            h={100}
          />
        </div>

        {/* Descripción de la alerta */}
        <div className={styles.alertDescription}>
          {props?.item?.descrip || "Se encontró un gatito perdido en medio del incendio."}
        </div>

        {/* Separador horizontal */}
        <div className={styles.divider}></div>

        {/* Contenedor para la información detallada */}
        <div className={styles.detailsContainer}>
          <div className={styles.detailRow}>
            <div className={styles.label}>Nivel de alerta</div>
            <div className={styles.valueHighlight}>
              {props?.item?.alert_level || "Nivel medio"}
            </div>
          </div>

          <div className={styles.detailRow}>
            <div className={styles.label}>Fecha y hora de creación</div>
            <div className={styles.value}>
              {getDateTimeStrMesShort(props?.item?.created_at) || "22 de marzo, 2025 - 09:12"}
            </div>
          </div>

          <div className={styles.detailRow}>
            <div className={styles.label}>Guardia</div>
            <div className={styles.value}>
              {getFullName(props?.item?.guardia) || "Roberto Cossio LaMadrid"}
            </div>
          </div>

          <div className={styles.detailRow}>
            <div className={styles.label}>C.I.</div>
            <div className={styles.value}>
              {props?.item?.guardia?.ci || "6473845"}
            </div>
          </div>
        </div>

        {/* Si hay acciones relacionadas con la alerta, se pueden agregar aquí */}
        {props?.item?.has_actions && (
          <div className={styles.buttonContainer}>
            <Button
              className={styles.actionButton}
              onClick={() => {
                // Acción relacionada con la alerta
                if (props?.onConfirm) props.onConfirm(props?.item);
                props?.onClose();
              }}
            >
              {props?.item?.action_text || "Tomar acción"}
            </Button>
          </div>
        )}
      </div>
    </DataModal>
  );
};

export default RenderView;