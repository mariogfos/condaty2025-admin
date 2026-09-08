"use client";
import React, { memo } from "react";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import Button from "@/mk/components/forms/Button/Button";
import { formatToDayFdMYH } from "@/mk/utils/date";
import styles from "./RenderView.module.css";
import useAxios from "@/mk/hooks/useAxios";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { formatBs } from "@/mk/utils/numbers";
import { parseExpenseDescription } from "../utils/expenseDescription";
import { Ban } from "lucide-react";
import { FinancialDetailModal } from "@/features/financial-records/FinancialDetailModal";
import {
  FinancialDetailGrid,
  FinancialDetailMessage,
  FinancialDetailSection,
  type FinancialDetailField,
} from "@/features/financial-records/FinancialDetailPrimitives";
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
  url_file?: (string | null)[];
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
  reLoad?: () => void | Promise<void>;
}

interface DetailItem {
  key: string;
  label: string;
  value: React.ReactNode;
  multiline?: boolean;
  valueClassName?: string;
}

const typeAccountMap: Record<string, string> = {
  C: "Cuenta corriente",
  S: "Caja de ahorro",
};
const RenderView: React.FC<DetailOutlayProps> = memo((props) => {
  const { open, onClose, extraData, item, onDel, reLoad } = props;
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
          (c) => c.id === subCategoryData.category_id,
        );
        categoryName = parentCategory ? parentCategory.name : "-/-";
      } else {
        categoryName = subCategoryData.name;
        subCategoryName = "-/-";
      }
    } else if (item?.category_id && extraData?.categories) {
      const foundCategory = extraData.categories.find(
        (c) => c.id === item.category_id,
      );
      if (foundCategory) {
        if (foundCategory.category_id) {
          const parentCategory = extraData.categories.find(
            (c) => c.id === foundCategory.category_id,
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

  if (!item) {
    return (
      <FinancialDetailModal
        open={open}
        onClose={onClose}
        title="Detalle del egreso"
      >
        <FinancialDetailSection>
          <FinancialDetailMessage>
            No se encontró información del egreso. Cierra el detalle e intenta nuevamente.
          </FinancialDetailMessage>
        </FinancialDetailSection>
      </FinancialDetailModal>
    );
  }

  const currentItem = item;

  const { categoryName, subCategoryName } = item
    ? getCategoryNames()
    : { categoryName: "", subCategoryName: "" };
  const parsedDescription = parseExpenseDescription(item?.description);

  const getStatusStyle = (status: string) => {
    if (status === "A") return styles.statusPaid;
    if (status === "X") return styles.statusCancelled;
    return "";
  };

  const getBankAccountSummary = () => {
    const aliasHolder = item?.bank_account?.alias_holder;
    const bankName = item?.bank_account?.bank_entity?.name;

    if (aliasHolder && bankName) return `${aliasHolder} - (${bankName})`;
    return aliasHolder || bankName || "-/-";
  };

  const getAccountNumberSummary = () => {
    const accountType = typeAccountMap[item?.bank_account?.account_type || ""];
    const accountNumber = item?.bank_account?.account_number;

    if (accountType && accountNumber) return `${accountType} - ${accountNumber}`;
    return accountNumber || accountType || "-/-";
  };

  const handleAnularClick = () => {
    if (item && onDel) {
      onDel(item);
    }
  };

  const getOutlayVoucherUrls = () => {
    const urls = Array.isArray(currentItem.url_file)
      ? currentItem.url_file
          .map((url) =>
            String(url || "")
              .replace(/[`'"\s]/g, "")
              .trim(),
          )
          .filter(Boolean)
      : [];

    if (urls.length > 0) {
      return urls;
    }

    if (currentItem.ext) {
      return [
        getUrlImages(
          `/EXPENSE-${currentItem.id}.${currentItem.ext}?d=${
            currentItem.updated_at || Date.now()
          }`,
        ),
      ];
    }

    return [];
  };

  const openFileInNewTab = (path: string) => {
    const fileUrl = getUrlImages(path);
    window.open(fileUrl, "_blank");
  };

  const voucherUrls = getOutlayVoucherUrls();
  const hasVoucherUrls = voucherUrls.length > 0;

  const handleDownloadVouchers = async () => {
    if (!hasVoucherUrls) return;

    try {
      showToast("Descargando comprobantes...", "info");
      const container = document.createElement("div");
      container.style.display = "none";
      document.body.appendChild(container);

      for (let index = 0; index < voucherUrls.length; index++) {
        const url = voucherUrls[index];

        try {
          const response = await fetch(url, { mode: "cors" });
          if (!response.ok) continue;

          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          let fileName = `comprobante-egreso-${index + 1}`;

          try {
            const parsedUrl = new URL(url);
            const lastSegment = parsedUrl.pathname.split("/").pop() || "";
            if (lastSegment) fileName = lastSegment;
          } catch {}

          if (!/\.[a-zA-Z0-9]+$/.test(fileName)) {
            const ext = (blob.type.split("/")[1] || "file").replace(
              /[^a-zA-Z0-9]/g,
              "",
            );
            fileName = `${fileName}.${ext}`;
          }

          const anchor = document.createElement("a");
          anchor.href = blobUrl;
          anchor.download = fileName;
          container.appendChild(anchor);
          anchor.click();
          window.URL.revokeObjectURL(blobUrl);
          anchor.remove();
        } catch {}
      }

      setTimeout(() => {
        container.remove();
      }, 500);
      showToast("Descarga finalizada", "success");
    } catch {
      showToast("No se pudieron descargar los comprobantes", "error");
    }
  };

  const handleViewOrDownloadVouchers = () => {
    if (!hasVoucherUrls) return;

    if (voucherUrls.length === 1) {
      window.open(voucherUrls[0], "_blank", "noopener,noreferrer");
      return;
    }

    handleDownloadVouchers();
  };

  const handleGenerateReceipt = async () => {
    showToast("Generando nota de egreso...", "info");

    const { data: file, error } = await execute(
      "/payment-nota",
      "POST",
      { id: item?.id },
      false,
      true,
    );

    if (file?.success === true && file?.data?.path) {
      openFileInNewTab("/" + file.data.path);
      showToast("Nota de egreso generado con éxito.", "success");
    } else {
      showToast(
        error?.data?.message || "No se pudo generar la nota de egreso.",
        "error",
      );
    }
  };

  const detailItems = [
    {
      key: "category",
      label: "Categoría",
      value: categoryName,
    },
    {
      key: "subcategory",
      label: "Subcategoría",
      value: subCategoryName,
    },
    {
      key: "registeredBy",
      label: "Registrado por",
      value: currentItem.user
        ? getFullName({
            ...currentItem.user,
            middle_name: currentItem.user.middle_name || undefined,
            last_name: currentItem.user.last_name || undefined,
            mother_last_name: currentItem.user.mother_last_name || undefined,
          })
        : "-/-",
    },
    currentItem.status === "X" && currentItem.canceled_by
      ? {
          key: "canceledBy",
          label: "Anulado por",
          value: getFullName({
            ...currentItem.canceled_by,
            middle_name: currentItem.canceled_by.middle_name || undefined,
            last_name: currentItem.canceled_by.last_name || undefined,
            mother_last_name:
              currentItem.canceled_by.mother_last_name || undefined,
          }),
        }
      : null,
    {
      key: "concept",
      label: "Concepto",
      value: parsedDescription.concept,
      multiline: true,
    },
    parsedDescription.reference
      ? {
          key: "reference",
          label: "Referencia",
          value: parsedDescription.reference,
          multiline: true,
        }
      : null,
    currentItem.type
      ? {
          key: "paymentMethod",
          label: "Método de Pago",
          value: getPaymentMethodText(currentItem.type),
        }
      : null,
    currentItem.bank_account_id
      ? {
          key: "bankAccount",
          label: "Cuenta bancaria",
          value: getBankAccountSummary(),
        }
      : null,
    parsedDescription.holderName
      ? {
          key: "holderName",
          label: "Titular de devolución",
          value: parsedDescription.holderName,
          multiline: true,
        }
      : null,
    parsedDescription.accountNumber
      ? {
          key: "accountNumber",
          label: "Cuenta destino",
          value: parsedDescription.accountNumber,
          multiline: true,
        }
      : null,
    parsedDescription.bankName
      ? {
          key: "bankName",
          label: "Banco destino",
          value: parsedDescription.bankName,
          multiline: true,
        }
      : null,
    parsedDescription.documentId
      ? {
          key: "documentId",
          label: "CI titular",
          value: parsedDescription.documentId,
          multiline: true,
        }
      : null,
    {
      key: "status",
      label: "Estado",
      value: getStatusText(currentItem.status),
      valueClassName: getStatusStyle(currentItem.status),
    },
    currentItem.status === "X" && currentItem.canceled_obs
      ? {
          key: "canceledReason",
          label: "Motivo de anulación",
          value: currentItem.canceled_obs,
          valueClassName: styles.canceledReason,
        }
      : null,
    currentItem.bank_account_id
      ? {
          key: "accountNumberSummary",
          label: "Número de cuenta",
          value: getAccountNumberSummary(),
        }
      : null,
  ].filter(Boolean) as DetailItem[];

  const detailFields: FinancialDetailField[] = detailItems.map((detail) => ({
    id: detail.key,
    label: detail.label,
    value: detail.value,
    wide: detail.multiline,
    tone:
      detail.key === "status"
        ? currentItem.status === "A"
          ? "success"
          : currentItem.status === "X"
            ? "danger"
            : "default"
        : detail.key === "canceledReason"
          ? "danger"
          : "default",
  }));

  const footer = (
    <>
      <Button
        variant="secondary"
        className={styles.voucherButton}
        onClick={handleGenerateReceipt}
      >
        Descargar nota de egreso
      </Button>

      {hasVoucherUrls && (
        <Button
          variant="primary"
          className={styles.voucherButton}
          onClick={handleViewOrDownloadVouchers}
        >
          {voucherUrls.length > 1 ? "Descargar comprobantes" : "Ver comprobante"}
        </Button>
      )}
    </>
  );

  return (
    <FinancialDetailModal
      open={open}
      onClose={onClose}
      title="Detalle del egreso"
      description="Información contable, respaldo e historial de cambios del egreso."
      record={{
        type: "expense",
        id: currentItem.id,
        paidAt: currentItem.date_at,
      }}
      summary={{
        amount: formatBs(currentItem.amount),
        date: formatToDayFdMYH(currentItem.date_at),
        eyebrow: "Monto pagado",
        status: {
          label: getStatusText(currentItem.status),
          tone: currentItem.status === "A" ? "success" : "danger",
        },
      }}
      customActions={
        onDel && currentItem.status !== "X"
          ? [
              {
                id: "cancel-expense",
                label: "Anular egreso",
                icon: <Ban size={18} />,
                destructive: true,
                onSelect: handleAnularClick,
              },
            ]
          : []
      }
      onRecordChanged={async () => {
        await reLoad?.();
      }}
      footer={footer}
    >
      <FinancialDetailSection title="Datos del egreso">
        <FinancialDetailGrid fields={detailFields} />
      </FinancialDetailSection>
    </FinancialDetailModal>
  );
});

RenderView.displayName = "RenderViewOutlays";

export default RenderView;
