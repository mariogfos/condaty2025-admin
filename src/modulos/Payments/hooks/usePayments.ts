import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/mk/contexts/AuthProvider";
import useCrud from "@/mk/hooks/useCrud/useCrud";
import { paymentsApi } from "../api";
import { getUrlImages } from "@/mk/utils/string";
import type { TableRowContextMenuConfig } from "@/mk/components/ui/Table/Table";
import { Eye, FileImage, CheckCircle2, Ban } from "lucide-react";
import { getPaymentsConfig } from "../config/payments.config";
import { PaymentStatus } from "../Type/PaymentType";
import styles from "../Payments.module.css";

const getPaymentVoucherUrls = (item: any) => {
  const urls = Array.isArray(item?.url_file)
    ? item.url_file
        .map((url: any) =>
          String(url || "")
            .replace(/[`'"\s]/g, "")
            .trim(),
        )
        .filter(Boolean)
    : [];

  if (urls.length > 0) {
    return urls;
  }

  if (item?.ext && item?.id) {
    return [
      getUrlImages(
        `/PAYMENT-${item.id}.${item.ext}?d=${item.updated_at || ""}`,
      ),
    ];
  }

  return [];
};

export const usePayments = () => {
  const router = useRouter();
  const { userCan, setStore, store } = useAuth();
  const [openCustomFilter, setOpenCustomFilter] = useState(false);
  const [customDateErrors, setCustomDateErrors] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  const { mod, fields } = useMemo(
    () => getPaymentsConfig(styles.textEllipsis, styles.alignRight, styles.center),
    []
  );

  const paramsInitial = useMemo(
    () => ({
      perPage: 20,
      page: 1,
      fullType: "L",
      searchBy: "",
    }),
    []
  );

  const handleGetFilter = useCallback((opt: string, value: string, oldFilterState: any) => {
    const currentFilters = { ...(oldFilterState?.filterBy || {}) };

    if (opt === "paid_at" && value === "custom") {
      setCustomDateErrors({});
      setOpenCustomFilter(true);
      delete currentFilters[opt];
      return { filterBy: currentFilters };
    }

    if (value === "" || value === null || value === undefined) {
      delete currentFilters[opt];
    } else {
      currentFilters[opt] = value;
    }
    return { filterBy: currentFilters };
  }, []);

  const goToCategories = useCallback((type = "") => {
    if (type) {
      router.push(`/categories?type=${type}`);
    } else {
      router.push("/categories");
    }
  }, [router]);

  const extraButtons = useMemo(
    () => [
      {
        key: "categories-button",
        variant: "secondary",
        onClick: () => goToCategories("I"),
        className: styles.categoriesButton,
        children: "Categorías",
      } as any,
    ],
    [goToCategories]
  );

  const crud = useCrud({
    paramsInitial,
    mod,
    fields,
    extraButtons: extraButtons.map((btn) => btn.children), // useCrud expects ReactNodes or custom array of children buttons
    getFilter: handleGetFilter,
  });

  const approvePayment = useCallback(async (row: any) => {
    if (!row?.id) return;

    const { data, error } = await crud.execute(
      paymentsApi.confirm(row.id),
      "POST",
      {
        confirm: PaymentStatus.PAID,
        confirm_obs: "",
      },
      false,
      true,
    );

    if (data?.success === true) {
      crud.showToast(data?.message || "Pago aprobado con éxito", "success");
      await crud.reLoad();
      return;
    }

    crud.showToast(
      error?.data?.message || error?.message || "No se pudo aprobar el pago",
      "error",
    );
  }, [crud.execute, crud.showToast, crud.reLoad]);

  const rowContextMenu = useMemo<TableRowContextMenuConfig<any>>(
    () => ({
      items: (row) => {
        const voucherUrls = getPaymentVoucherUrls(row);
        const canCancel = row?.status === PaymentStatus.PAID && Boolean(row?.user);

        if (row?.status === PaymentStatus.SUBMITTED) {
          return [
            {
              label: "Ver comprobante",
              icon: FileImage,
              disabled: voucherUrls.length === 0,
              onClick: () => {
                if (voucherUrls.length === 0) return;
                window.open(voucherUrls[0], "_blank", "noopener,noreferrer");
              },
            },
            {
              label: "Aprobar pago",
              icon: CheckCircle2,
              onClick: () => approvePayment(row),
            },
            {
              label: "Rechazar pago",
              icon: Ban,
              danger: true,
              onClick: () => crud.onView({ ...row, __openRejectModal: true }),
            },
          ];
        }

        const primaryLabel =
          row?.status === PaymentStatus.CANCELLED ? "Ver anulación" : "Ver detalle";

        const items: any[] = [
          {
            label: primaryLabel,
            icon: Eye,
            onClick: () => crud.onView(row),
          },
        ];

        if (voucherUrls.length > 0) {
          items.push({
            label:
              voucherUrls.length > 1 ? "Ver comprobantes" : "Ver comprobante",
            icon: FileImage,
            onClick: () => {
              window.open(voucherUrls[0], "_blank", "noopener,noreferrer");
            },
          });
        }

        if (canCancel) {
          items.push({ separator: true });
          items.push({
            label: "Anular ingreso",
            icon: Ban,
            danger: true,
            onClick: () => crud.onDel(row),
          });
        }

        return items;
      },
    }),
    [approvePayment, crud.onDel, crud.onView],
  );

  useEffect(() => {
    setStore((prev: any) => ({ ...prev, title: "Ingresos" }));
  }, [setStore]);

  return {
    List: crud.List,
    onFilter: crud.onFilter,
    userCan,
    modPermission: mod.permiso,
    openCustomFilter,
    setOpenCustomFilter,
    customDateErrors,
    setCustomDateErrors,
    rowContextMenu,
    goToCategories,
    extraButtons,
  };
};

export default usePayments;
