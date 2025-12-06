import React, { memo, useState, useMemo, useCallback, useEffect } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { getDateTimeStrMesShort } from "@/mk/utils/date";
import styles from "./RenderView.module.css";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { Image } from "@/mk/components/ui/Image/Image";
import { IconArrowLeft, IconArrowRight } from "@/components/layout/icons/IconsBiblioteca";

interface BinnacleDetailProps {
  open: boolean;
  onClose: () => void;
  item: any;

}

const RenderView = memo((props: BinnacleDetailProps) => {
  const { open, onClose, item } = props;

  const normalizeHasImage = (v: any) => v === true || v === 1 || v === "1";

  const [imageExist, setImageExist] = useState<boolean>(normalizeHasImage(item?.has_image));
  const hasGuardImage = normalizeHasImage(item?.guardia?.has_image);

  const images: string[] = useMemo(() => {
    const arr = Array.isArray(item?.url_file) ? item.url_file : [];
    return arr
      .map((u: any) => (typeof u === "string" ? u.trim().replace(/^`|`$/g, "") : ""))
      .filter((u: string) => u && /^https?:\/\//.test(u));
  }, [item?.url_file]);

  const [indexVisible, setIndexVisible] = useState(0);
  useEffect(() => {
    setIndexVisible(0);
  }, [open, item?.id]);

  const nextIndex = useCallback(() => {
    setIndexVisible((prev) => (images.length ? (prev + 1) % images.length : 0));
  }, [images.length]);

  const prevIndex = useCallback(() => {
    setIndexVisible((prev) => (images.length ? (prev === 0 ? images.length - 1 : prev - 1) : 0));
  }, [images.length]);

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
        {images.length > 0 ? (
          <div className={styles.imageContainer}>
            <div style={{ width: "100%" }}>
              <div className={styles.imageWrapper}>
                <Image
                  alt="Imagen del reporte"
                  src={images[indexVisible]}
                  square={true}
                  expandable={true}
                  expandableIcon={false}
                  objectFit="contain"
                  borderRadius="var(--bRadiusM)"
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
              {images.length > 1 && (
                <div className={styles.containerButton}>
                  <div className={styles.button} onClick={prevIndex}>
                    <IconArrowLeft size={18} color="var(--cWhite)" />
                  </div>
                  <p style={{ color: "var(--cWhite)", fontSize: 10 }}>
                    {indexVisible + 1} / {images.length}
                  </p>
                  <div className={styles.button} onClick={nextIndex}>
                    <IconArrowRight size={18} color="var(--cWhite)" />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          imageExist && normalizeHasImage(item?.has_image) && (
            <div className={styles.imageContainer}>
              <Avatar
                src={getUrlImages("/GNEW-" + item.id + ".webp?d=" + item.updated_at)}
                h={298}
                w={298}
                onError={() => {
                  setImageExist(false);
                }}
                style={{ borderRadius: 16 }}
                name={getFullName(item)}
                expandable={true}
                hasImage={item?.has_image}
              />
            </div>
          )
        )}

        <div className={styles.detailsContainer}>
          <div className={styles.detailRow}>
            <div className={styles.value} style={{ display: "flex", gap: 8 }}>
              {hasGuardImage && (
                <Avatar
                  hasImage={item.guardia.has_image}
                  src={getUrlImages(
                    "/GUARD-" + item?.guardia?.id + ".webp?d=" + item?.guardia?.updated_at
                  )}
                  name={getFullName(item?.guardia)}
                />
              )}
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
