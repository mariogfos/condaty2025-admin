import React, { memo, useState } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { getDateTimeStrMesShort } from "@/mk/utils/date";
import styles from "./RenderView.module.css";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";

// Definir la interfaz para las props
interface BinnacleDetailProps {
  open: boolean;
  onClose: () => void;
  item: any; 
  extraData?: any;
}

// eslint-disable-next-line react/display-name
const RenderView = memo((props: BinnacleDetailProps) => {
  const { open, onClose, item } = props;
  const [imageExist, setImageExist] = useState(true);

  return (
    <DataModal
      open={open}
      onClose={onClose}
      title="Detalle del Reporte"
      buttonText=""
      buttonCancel=""
      style={{ maxWidth: 670 }}
    >
      <div className={styles.container}>
        {imageExist && (
          <div className={styles.imageContainer}>
            <Avatar
              src={getUrlImages(
                "/GNEW-" + item.id + ".webp?d=" + item.updated_at
              )}
              h={298}
              w={298}
              onError={() => {
                setImageExist(false);
              }}
              style={{ borderRadius: 16 }}
              name={getFullName(item)}
            />
          </div>
        )}

        <div className={styles.detailsContainer}>
          <div className={styles.detailRow}>
            <div className={styles.value} style={{ display: "flex", gap: 8 }}>
              <Avatar
                hasImage={item?.guardia?.has_image}
                src={getUrlImages(
                  "/GUARD-" +
                    item?.guardia?.id +
                    ".webp?d=" +
                    item?.guardia?.updated_at
                )}
                name={getFullName(item.guardia)}
              />
              <div>
                {getFullName(item.guardia) || "Sin guardia asignado"}
                <div className={styles.label}>Guardia</div>
              </div>
            </div>
          </div>
          <div className={styles.detailRow}>
            <div className={styles.label}>Fecha</div>
            <div className={styles.value}>
              {getDateTimeStrMesShort(item.created_at)}
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

export default RenderView;
