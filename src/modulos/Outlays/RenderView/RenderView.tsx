"use client";
import React, { memo } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import Button from "@/mk/components/forms/Button/Button";
import { formatToDayFdMYH } from "@/mk/utils/date";
import styles from "./RenderView.module.css";
import useAxios from "@/mk/hooks/useAxios";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { formatBs } from "@/mk/utils/numbers";
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
  bank_account?: object | any;
  bank_account_id?: number | string | null;
  description?: string;
  category?: Category;
  category_id?: number | string;
  status: "A" | "X" | string;
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
const typeAccountMap: Record<string, string> = {
  C: "Cuenta corriente",
  S: "Caja de ahorro",
};
const RenderView: React.FC<DetailOutlayProps> = memo((props) => {
  const { open, onClose, extraData, item, onDel } = props;
  const { execute } = useAxios();
  const { showToast } = useAuth();

  const paymentMethodMap: Record<string, string> = {
    T: "Transferencia bancaria",
    O: "Pago en oficina",
    Q: "Pago QR",
    E: "Efectivo",
    C: "Cheque",
  };

  const getPaymentMethodText = (type: string): string => {
    return paymentMethodMap[type] || type;
  };

  const getCategoryNames = () => {
    let categoryName = "-/-";
    let subCategoryName = "-/-";

    if (item?.category) {
      const subCategoryData = item.category;
      subCategoryName = subCategoryData.name || "-/-";
      if (subCategoryData.padre && typeof subCategoryData.padre === "object") {
        categoryName = subCategoryData.padre.name || "-/-";
      } else if (subCategoryData.category_id && extraData?.categories) {
        const parentCategory = extraData.categories.find(
          (c) => c.id === subCategoryData.category_id
        );
        categoryName = parentCategory ? parentCategory.name : "-/-";
      } else {
        categoryName = subCategoryData.name;
        subCategoryName = "-/-";
      }
    } else if (item?.category_id && extraData?.categories) {
      const foundCategory = extraData.categories.find(
        (c) => c.id === item.category_id
      );
      if (foundCategory) {
        if (foundCategory.category_id) {
          const parentCategory = extraData.categories.find(
            (c) => c.id === foundCategory.category_id
          );
          categoryName = parentCategory ? parentCategory.name : "-/-";
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
      A: "Pagado",
      X: "Anulado",
    };
    return statusMap[status] || status;
  };

  const { categoryName, subCategoryName } = item
    ? getCategoryNames()
    : { categoryName: "", subCategoryName: "" };

  const getStatusStyle = (status: string) => {
    if (status === "A") return styles.statusPaid;
    if (status === "X") return styles.statusCancelled;
    return "";
  };

  const handleAnularClick = () => {
    if (item && onDel) {
      onDel(item);
    }
  };

  const openFileInNewTab = (path: string) => {
    const fileUrl = getUrlImages(path);
    window.open(fileUrl, "_blank");
  };

  const handleGenerateReceipt = async () => {
    showToast("Generando nota de egreso...", "info");

    const { data: file, error } = await execute(
      "/payment-nota",
      "POST",
      { id: item?.id },
      false,
      true
    );

    if (file?.success === true && file?.data?.path) {
      openFileInNewTab("/" + file.data.path);
      showToast("Nota de egreso generado con éxito.", "success");
    } else {
      showToast(
        error?.data?.message || "No se pudo generar la nota de egreso.",
        "error"
      );
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
        minWidth={860}
        maxWidth={980}
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
  console.log(item);
  return (
    <DataModal
      open={open}
      onClose={onClose}
      title="Detalle del Egreso"
      buttonText=""
      buttonCancel=""
      minWidth={860}
      maxWidth={980}
      headerDivider={false}
    >
      
      <div className={styles.container}>
        <div className={styles.headerSection}>
          <div className={styles.amountDisplay}>{formatBs(item.amount)}</div>
          <div className={styles.dateDisplay}>
            {formatToDayFdMYH(item.date_at)}
          </div>
        </div>

      </div>
      <div className={styles.container}>
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
                  : "-/-"}
              </span>
            </div>
            {item.status === "X" && item.canceled_by && (
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Anulado por</span>
                <span className={styles.infoValue}>
                  {getFullName({
                    ...item.canceled_by,
                    middle_name: item.canceled_by.middle_name || undefined,
                    last_name: item.canceled_by.last_name || undefined,
                    mother_last_name:
                      item.canceled_by.mother_last_name || undefined,
                  })}
                </span>
              </div>
            )}
            
          </div>
          {/* Columna Central */}
          <div className={styles.detailsColumn}>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Concepto</span>
              <span className={styles.infoValue}>
                {((item.description || "-/-").match(/.{1,20}/g) || []).map(
                  (line, idx) => (
                    <span key={idx}>{line}</span>
                  )
                )}
              </span>
            </div>
            {item.type && (
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Método de Pago</span>
                <span className={styles.infoValue}>
                  {getPaymentMethodText(item.type)}
                </span>
              </div>
            )}
            {item?.bank_account_id && (
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Cuenta bancaria</span>
                <span className={styles.infoValue}>
                  {item.bank_account?.alias_holder +
                    " - (" +
                    item.bank_account?.bank_entity?.name +
                    ")" || "-/-"}
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
            
            {item.status === "X" && item.canceled_obs && (
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Motivo de anulación</span>
                <span
                  className={`${styles.infoValue} ${styles.canceledReason}`}
                >
                  {item.canceled_obs}
                </span>
              </div>
            )}
            
            {item?.bank_account_id && (
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Número de cuenta</span>
                <span className={styles.infoValue}>
                  {typeAccountMap[item.bank_account?.account_type || ""] +
                    " - " +
                    item.bank_account?.account_number || "-/-"}
                </span>
              </div>
            )}
          </div>
        </section>

      </div>

      <div className={styles.voucherButtonContainer}>

        {item && onDel && item.status !== "X" && (
          <Button
            variant="danger"
            onClick={handleAnularClick}
            className={styles.textButtonDanger}
            style={{ marginRight: 8 }}
          >
            Anular egreso
          </Button>
        )}

        <Button
          variant="secondary"
          className={styles.voucherButton}
          style={{ marginRight: item.ext ? 8 : 0 }}
          onClick={handleGenerateReceipt}
          >
          Descargar nota de egreso
        </Button>

        {item.ext && (
          <Button
            variant="secondary"
            className={styles.voucherButton}
            onClick={() =>
              openFileInNewTab(
                `/EXPENSE-${item.id}.${item.ext}?d=${
                  item.updated_at || Date.now()
                }`
              )
            }
            >
            Ver comprobante
          </Button>
        )}
      </div>
    </DataModal>
  );
});

RenderView.displayName = "RenderViewOutlays";

export default RenderView;
