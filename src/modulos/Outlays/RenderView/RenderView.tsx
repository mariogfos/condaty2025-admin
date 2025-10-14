'use client';
import React, { memo } from 'react';
import DataModal from '@/mk/components/ui/DataModal/DataModal';
import { getFullName, getUrlImages } from '@/mk/utils/string';
import Button from '@/mk/components/forms/Button/Button';
import { formatToDayDDMMYYYYHHMM } from '@/mk/utils/date';
import styles from './RenderView.module.css';
import { formatBs } from '@/mk/utils/numbers';
interface Category {
  id: number | string;
  name: string;
  padre?: Category | null;
  category_id?: number | string | null;
}
interface User {
  id: string;
  name: string;
  last_name?: string | null;
  middle_name?: string | null;
  mother_last_name?: string | null;
  has_image?: string;
}
interface OutlayItem {
  id: number | string;
  amount: number;
  date_at: string;
  description?: string;
  category?: Category;
  category_id?: number | string;
  status: 'A' | 'X' | string;
  type?: string;
  ext?: string;
  updated_at?: string;
  user?: User | null;
  canceled_by?: User | null;
  canceled_obs?: string;
}
interface ExtraData {
  categories?: Category[];
}
interface DetailOutlayProps {
  open: boolean;
  onClose: () => void;
  item?: OutlayItem;
  extraData?: ExtraData;
  onDel?: (item: OutlayItem) => void;
}
const RenderView: React.FC<DetailOutlayProps> = memo(props => {
  const { open, onClose, extraData, item, onDel } = props;

  const paymentMethodMap: Record<string, string> = {
    T: 'Transferencia bancaria',
    O: 'Pago en oficina',
    Q: 'Pago QR',
    E: 'Efectivo',
    C: 'Cheque',
  };

  const getPaymentMethodText = (type: string): string => {
    return paymentMethodMap[type] || type;
  };

  const getCategoryNames = () => {
    let categoryName = '-/-';
    let subCategoryName = '-/-';

    if (item?.category) {
      const subCategoryData = item.category;
      subCategoryName = subCategoryData.name || '-/-';
      if (subCategoryData.padre && typeof subCategoryData.padre === 'object') {
        categoryName = subCategoryData.padre.name || '-/-';
      } else if (subCategoryData.category_id && extraData?.categories) {
        const parentCategory = extraData.categories.find(
          c => c.id === subCategoryData.category_id
        );
        categoryName = parentCategory ? parentCategory.name : '-/-';
      } else {
        categoryName = subCategoryData.name;
        subCategoryName = '-/-';
      }
    } else if (item?.category_id && extraData?.categories) {
      const foundCategory = extraData.categories.find(
        c => c.id === item.category_id
      );
      if (foundCategory) {
        if (foundCategory.category_id) {
          const parentCategory = extraData.categories.find(
            c => c.id === foundCategory.category_id
          );
          categoryName = parentCategory ? parentCategory.name : '-/-';
          subCategoryName = foundCategory.name;
        } else {
          categoryName = foundCategory.name;
          subCategoryName = '-/-';
        }
      }
    }
    return { categoryName, subCategoryName };
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      A: 'Pagado',
      X: 'Anulado',
    };
    return statusMap[status] || status;
  };
  const { categoryName, subCategoryName } = item
    ? getCategoryNames()
    : { categoryName: '', subCategoryName: '' };

  const getStatusStyle = (status: string) => {
    if (status === 'A') return styles.statusPaid;
    if (status === 'X') return styles.statusCancelled;
    return '';
  };
  const handleAnularClick = () => {
    if (item && onDel) {
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
        <div className={styles.container}>
          <div className={styles.messageContainer}>
            <p className={styles.messageText}>
              No se encontró información del egreso.
            </p>
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
      title="Detalle del Egreso"
      buttonText=""
      buttonCancel=""
      variant={"mini"}
      minWidth={480}
      maxWidth={720}
    >
      {item && onDel && item.status !== 'X' && (
        <div className={styles.headerActionContainer}>
          <button
            type="button"
            onClick={handleAnularClick}
            className={styles.textButtonDanger}
          >
            Anular egreso
          </button>
        </div>
      )}
      <div className={styles.container}>
        <div className={styles.headerSection}>
          <div className={styles.amountDisplay}>{formatBs(item.amount)}</div>
          <div className={styles.dateDisplay}>
            {formatToDayDDMMYYYYHHMM(item.date_at)}
          </div>
        </div>

        <hr className={styles.sectionDivider} />

        {/* Contenedor de la sección de detalles, usará flex para centrar las columnas */}
        <section className={styles.detailsSection}>
          {/* Columna Izquierda */}
          <div className={styles.detailsColumn}>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Categoría</span>
              <span className={styles.infoValue}>{categoryName}</span>
            </div>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Subcategoría</span>
              <span className={styles.infoValue}>{subCategoryName}</span>
            </div>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Registrado por</span>
              <span className={styles.infoValue}>
                {item.user
                  ? getFullName({
                    ...item.user,
                    middle_name: item.user.middle_name || undefined,
                    last_name: item.user.last_name || undefined,
                    mother_last_name: item.user.mother_last_name || undefined,
                  })
                  : '-/-'}
              </span>
            </div>
            
            {item.status === 'X' && item.canceled_by && (
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Anulado por</span>
                <span className={styles.infoValue}>
                  {getFullName({
                    ...item.canceled_by,
                    middle_name: item.canceled_by.middle_name || undefined,
                    last_name: item.canceled_by.last_name || undefined,
                    mother_last_name: item.canceled_by.mother_last_name || undefined,
                  })}
                </span>
              </div>
            )}
            
            {item.status === 'X' && item.canceled_obs && (
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Motivo de anulación</span>
                <span className={`${styles.infoValue} ${styles.canceledReason}`}>
                  {item.canceled_obs}
                </span>
              </div>
            )}
          </div>

          {/* Columna Derecha */}
          <div className={styles.detailsColumn}>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Estado</span>
              <span
                className={`${styles.infoValue} ${getStatusStyle(item.status)}`}
              >
                {getStatusText(item.status)}
              </span>
            </div>
            {item.type && (
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Forma de Pago</span>
                <span className={styles.infoValue}>
                  {getPaymentMethodText(item.type)}
                </span>
              </div>
            )}
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Concepto</span>
              <span className={styles.infoValue}>
                {((item.description || '-/-').match(/.{1,20}/g) || []).map((line, idx) => (
                  <span key={idx}>{line}</span>
                ))}
              </span>
            </div>
          </div>
        </section>

        <hr className={styles.sectionDivider} />

        {item.ext && (
          <div className={styles.voucherButtonContainer}>
            <Button
              variant="secondary"
              className={styles.voucherButton}
              onClick={() => {
                const imageUrl = getUrlImages(
                  `/EXPENSE-${item.id}.${item.ext}?d=${item.updated_at || Date.now()
                  }`
                );
                window.open(imageUrl, '_blank');
              }}
            >
              Ver comprobante
            </Button>
          </div>
        )}
      </div>
    </DataModal>
  );
});

RenderView.displayName = 'RenderViewOutlays';

export default RenderView;
