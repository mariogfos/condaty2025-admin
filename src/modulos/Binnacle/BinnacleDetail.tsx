import React, { memo } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { getFullName } from "@/mk/utils/string";
import { getDateTimeStrMesShort } from "@/mk/utils/date";
import styles from "./BinnacleDetail.module.css";

// Definir la interfaz para las props
interface BinnacleDetailProps {
  open: boolean;
  onClose: () => void;
  item: any; // Puedes ser más específico aquí si conoces la estructura exacta
  extraData?: any;
}

// eslint-disable-next-line react/display-name
const BinnacleDetail = memo((props: BinnacleDetailProps) => {
  const { open, onClose, item, extraData } = props;

  return (
    <DataModal
      open={open}
      onClose={onClose}
      title="Detalle de Bitácora"
      buttonText=""
      buttonCancel=""
    >
      <div className={styles.container}>
        <div className={styles.detailRow}>
          <div className={styles.label}>Fecha</div>
          <div className={styles.value}>
            {getDateTimeStrMesShort(item.created_at)}
          </div>
        </div>

        <div className={styles.detailRow}>
          <div className={styles.label}>Guardia</div>
          <div className={styles.value}>
            {item.guard_id || "Sin guardia asignado"}
          </div>
        </div>

        <div className={styles.detailRow}>
          <div className={styles.label}>Descripción</div>
          <div className={styles.value}>
            {item.descrip || "Sin descripción"}
          </div>
        </div>

        {/* Si hay más campos en la bitácora, agrégalos aquí según necesites */}
      </div>
    </DataModal>
  );
});

export default BinnacleDetail;