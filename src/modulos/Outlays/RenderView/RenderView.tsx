"use client";

import React, { memo } from "react"; // Quitamos useState, useEffect
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { getUrlImages } from "@/mk/utils/string"; // Mantenemos utilidades necesarias
import Button from "@/mk/components/forms/Button/Button";
import { getDateStrMes } from "@/mk/utils/date";
import styles from "./RenderView.module.css"; // Reutiliza o crea estilos
// Quitamos useAxios ya que no se usará aquí
import { formatNumber } from "@/mk/utils/numbers";

// Props para el modal de detalles de Egreso (Ahora espera 'item' directamente)
interface DetailOutlayProps {
  open: boolean;
  onClose: () => void;
  item: any | null; // El objeto egreso con todos los detalles
  extraData?: any; // Para buscar nombres de categorías
}

// eslint-disable-next-line react/display-name
const RenderView: React.FC<DetailOutlayProps> = memo((props) => {
  // Desestructuramos 'item' directamente de las props
  const { open, onClose, extraData, item } = props;

  // Ya no necesitamos estado local para 'item', isLoading, o loadError
  // Tampoco necesitamos el useEffect ni fetchOutlayData

  // Función auxiliar para obtener nombre de categoría y subcategoría
  const getCategoryNames = () => {
    let categoryName = "Desconocida";
    let subCategoryName = "-/-";

    // Usa 'item' directamente de las props
    if (item?.category_id && extraData?.categories) {
      const foundCategory = extraData.categories.find((c: any) => c.id === item.category_id);
      if (foundCategory) {
        if (foundCategory.category_id) {
          const parentCategory = extraData.categories.find((c: any) => c.id === foundCategory.category_id);
          categoryName = parentCategory ? parentCategory.name : "Padre Desconocido";
          subCategoryName = foundCategory.name;
        } else if (foundCategory.padre && typeof foundCategory.padre === 'object') {
           categoryName = foundCategory.padre.name || "Padre Desconocido";
           subCategoryName = foundCategory.name;
        } else {
          categoryName = foundCategory.name;
        }
      }
    } else if (item?.category) {
        if (item.category.padre && typeof item.category.padre === 'object') {
            categoryName = item.category.padre.name || "Padre Desconocido";
            subCategoryName = item.category.name;
        } else {
            categoryName = item.category.name;
        }
    }
    return { categoryName, subCategoryName };
  };

  // Función para obtener el texto del estado
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      "A": "Pagado",
      "C": "Anulado",
    };
    return statusMap[status] || status;
  };

  // Llama a la función auxiliar (solo si hay 'item')
  const { categoryName, subCategoryName } = item ? getCategoryNames() : { categoryName: '', subCategoryName: '' };

  return (
    <DataModal
      open={open}
      onClose={onClose}
      title="Información del Egreso"
      buttonText=""
      buttonCancel=""
    >
      <div className={styles.container}>
        {/* Mostrar contenido solo si 'item' tiene datos */}
        {!item ? (
           // Mensaje si no hay item (podría ser mientras carga en el padre)
          <p>Cargando información...</p>
        ) : (
          <>
            <div className={styles.detailsContainer}>
              <div className={styles.detailRow}>
                <div className={styles.label}>Categoría</div>
                <div className={styles.value}>{categoryName}</div>
              </div>
              <div className={styles.detailRow}>
                <div className={styles.label}>Subcategoría</div>
                <div className={styles.value}>{subCategoryName}</div>
              </div>
              <div className={styles.detailRow}>
                <div className={styles.label}>Monto</div>
                <div className={styles.value}>Bs {formatNumber(item.amount)}</div>
              </div>
              <div className={styles.detailRow}>
                <div className={styles.label}>Descripción</div>
                <div className={styles.value}>{item.description || "Sin descripción"}</div>
              </div>
               <div className={styles.detailRow}>
                <div className={styles.label}>Estado</div>
                <div className={styles.value}>{getStatusText(item.status)}</div>
              </div>
              <div className={styles.detailRow}>
                <div className={styles.label}>Fecha</div>
                <div className={styles.value}>{getDateStrMes(item.date_at)}</div>
              </div>
            </div>

            <div className={styles.divider}></div>

            {item.ext && (
              <div className={styles.buttonContainer}>
                <Button
                  className={`${styles.downloadButton}`}
                  onClick={() => {
                    const imageUrl = getUrlImages(
                      `/EXPENSE-${item.id}.${item.ext}?d=${item.updated_at || Date.now()}`
                    );
                    window.open(imageUrl, "_blank");
                  }}
                >
                  Descargar comprobante
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </DataModal>
  );
});

export default RenderView;