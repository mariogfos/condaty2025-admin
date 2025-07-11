// @ts-nocheck
"use client";

import React, { memo } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { getUrlImages } from "@/mk/utils/string";
import Button from "@/mk/components/forms/Button/Button";
import { getDateStrMes, getDateTimeStrMesShort } from "@/mk/utils/date"; // getDateTimeStrMesShort para consistencia
import styles from "./RenderView.module.css"; // Asegúrate que la ruta sea correcta
import { formatNumber } from "@/mk/utils/numbers";

interface DetailOutlayProps {
  open: boolean;
  onClose: () => void;
  item: any | null;
  extraData?: any;
  onDel: () => void;
}

// eslint-disable-next-line react/display-name
const RenderView: React.FC<DetailOutlayProps> = memo((props) => {
  const { open, onClose, extraData, item, onDel } = props;

  const paymentMethodMap: Record<string, string> = {
    'T': 'Transferencia',
    'O': 'Pago en oficina',
    'Q': 'QR',
    'E': 'Efectivo',
    'C': 'Cheque',
  };
  
  const getPaymentMethodText = (type: string): string => {
    return paymentMethodMap[type] || type; // Devuelve el código si no se encuentra el mapeo
  };

  const getCategoryNames = () => {
    let categoryName = "Desconocida";
    let subCategoryName = "-/-";

    if (item?.category) {
        const subCategoryData = item.category;
        subCategoryName = subCategoryData.name || "Subcategoría sin nombre";
        if (subCategoryData.padre && typeof subCategoryData.padre === 'object') {
            categoryName = subCategoryData.padre.name || "Categoría sin nombre";
        } else if (subCategoryData.category_id && extraData?.categories) {
            const parentCategory = extraData.categories.find((c: any) => c.id === subCategoryData.category_id);
            categoryName = parentCategory ? parentCategory.name : "Categoría Desconocida (ID)";
        } else {
            categoryName = subCategoryData.name;
            subCategoryName = "-/-";
        }
    } else if (item?.category_id && extraData?.categories) {
        const foundCategory = extraData.categories.find((c: any) => c.id === item.category_id);
        if (foundCategory) {
             if (foundCategory.category_id) {
                const parentCategory = extraData.categories.find((c: any) => c.id === foundCategory.category_id);
                categoryName = parentCategory ? parentCategory.name : "Categoría Desconocida (ID)";
                subCategoryName = foundCategory.name;
            } else {
                categoryName = foundCategory.name;
                subCategoryName = "-/-";
            }
        }
    }
    return { categoryName, subCategoryName };
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      "A": "Pagado",
      "X": "Anulado",
    };
    return statusMap[status] || status;
  };

  const { categoryName, subCategoryName } = item ? getCategoryNames() : { categoryName: '', subCategoryName: '' };

  // Determinar clase de estilo para el estado
  const getStatusStyle = (status: string) => {
    if (status === 'A') return styles.statusPaid;
    if (status === 'X') return styles.statusCancelled;
    return '';
  };
  const handleAnularClick = () => {
    if (item && onDel) { // Verifica que item y onDel existan
      onDel(item);
    }
  };


  if (!item) {
    return (
      <DataModal
        open={open}
        onClose={onClose}
        title="Información del Egreso"
        buttonText=""
        buttonCancel=""
      >
        <div className={styles.container}> {/* Contenedor principal también para el mensaje */}
          <div className={styles.messageContainer}>
            <p className={styles.messageText}>No se encontró información del egreso.</p>
            <p className={styles.messageSuggestion}>
              Por favor, verifica los detalles o intenta de nuevo más tarde.
            </p>
          </div>
        </div>
      </DataModal>
    );
  }

  return (
    <DataModal
      open={open}
      onClose={onClose}
      title="Detalle del Egreso" // Título similar al de Ingresos
      buttonText=""
      buttonCancel=""
    >
      {item && onDel && item.status !== 'X' && (
        <div className={styles.headerActionContainer}>
          {/* REEMPLAZO DEL BOTÓN */}
          <button
            type="button" // Es buena práctica especificar el type para botones fuera de forms
            onClick={handleAnularClick}
            className={styles.textButtonDanger} // Nueva clase para el text button rojo
          >
            Anular egreso
          </button>
        </div>
      )}
      <div className={styles.container}>
        <div className={styles.headerSection}>
          <div className={styles.amountDisplay}>Bs {formatNumber(item.amount)}</div>
          <div className={styles.dateDisplay}>
            {getDateTimeStrMesShort(item.date_at)} {/* Usar formato consistente */}
          </div>
        </div>

        <hr className={styles.sectionDivider} />

        <div className={styles.mainInfoGrid}>
          <div className={styles.infoColumn}>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Categoría</span>
              <span className={styles.infoValue}>{categoryName}</span>
            </div>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Subcategoría</span>
              <span className={styles.infoValue}>{subCategoryName}</span>
            </div>
          </div>

          <div className={styles.infoColumn}>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Estado</span>
              <span className={`${styles.infoValue} ${getStatusStyle(item.status)}`}>
                {getStatusText(item.status)}
              </span>
            </div>
            {item.type && ( // Solo mostrar si item.type tiene un valor
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Método de Pago</span>
                <span className={styles.infoValue}>{getPaymentMethodText(item.type)}</span>
              </div>
                )}
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Descripción</span>
              <span className={styles.infoValue}>{item.description || "Sin descripción"}</span>
            </div>
          </div>
        </div>

        {/* No es necesario otro divisor aquí a menos que haya más secciones */}
        <hr className={styles.sectionDivider} /> 

        {item.ext && (
          <div className={styles.voucherButtonContainer}>
            <Button
              variant="outline" // Para que tome estilos del CSS si es necesario o se defina en el botón mismo
              className={styles.voucherButton} // Aplicar la nueva clase
              onClick={() => {
                const imageUrl = getUrlImages(
                  `/EXPENSE-${item.id}.${item.ext}?d=${item.updated_at || Date.now()}`
                );
                window.open(imageUrl, "_blank");
              }}
            >
              Ver comprobante {/* Texto consistente con el de Ingresos */}
            </Button>
          </div>
        )}
      </div>
    </DataModal>
  );
});

export default RenderView;