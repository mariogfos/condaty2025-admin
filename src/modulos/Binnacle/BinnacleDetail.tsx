import React, { memo } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { getDateTimeStrMesShort } from "@/mk/utils/date";
import styles from "./BinnacleDetail.module.css";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";

// Definir la interfaz para las props
interface BinnacleDetailProps {
  open: boolean;
  onClose: () => void;
  item: any; // Puedes ser más específico aquí si conoces la estructura exacta
  extraData?: any;
}

// eslint-disable-next-line react/display-name
const BinnacleDetail = memo((props: BinnacleDetailProps) => {
  const { open, onClose, item } = props;

  return (
    <DataModal
      open={open}
      onClose={onClose}
      title="Detalle de Bitácora"
      buttonText=""
      buttonCancel=""
    >
      <div className={styles.container}>
        <div className={styles.imageContainer}>
          <Avatar
            src={getUrlImages(
              "/GNEW-" + item.id + ".webp?d=" + item.updated_at
            )}
            h={170}
            w={170}
            style={{ borderRadius: 16 }}
            name={getFullName(item)}
          />
        </div>

        <div className={styles.detailsContainer}>
          <div className={styles.detailRow}>
            <div className={styles.label}>Fecha</div>
            <div className={styles.value}>
              {getDateTimeStrMesShort(item.created_at)}
            </div>
          </div>

          <div className={styles.detailRow}>
            <div className={styles.label}>Guardia</div>
            <div className={styles.value}>
              {getFullName(item.guardia) || "Sin guardia asignado"}
            </div>
          </div>

          <div className={styles.detailRow}>
            <div className={styles.label}>Descripción</div>
            <div className={styles.value}>
              {item.descrip || "Sin descripción"}
            </div>
          </div>
        </div>
      </div>
    </DataModal>
  );
});

export default BinnacleDetail;