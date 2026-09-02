"use client";

import React, { useEffect, useState } from "react";
import Table from "@/mk/components/ui/Table/Table";
import { formatBs } from "@/mk/utils/numbers";
import { useAuth } from "@/mk/contexts/AuthProvider";
import Button from "@/mk/components/forms/Button/Button";
import { IconGallery } from "@/components/layout/icons/IconsBiblioteca";
import RenderViewPayment from "@/modulos/Payments/RenderView/RenderView";
import { getPaymentStatusConfig } from "@/types/payment";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import RenderFormAccount from "../RenderFormAccount/RenderFormAccount";
import { getDateStrMes, MONTHS } from "@/mk/utils/date";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { hasMaintenanceValue } from "@/mk/utils/utils";
import RenderDel from "@/modulos/Payments/RenderDel/RenderDel";
import { paymentsApi } from "@/modulos/Payments/api";
import { FinancialDetailModal } from "@/features/financial-records/FinancialDetailModal";
import {
  FinancialDetailGrid,
  FinancialDetailSection,
  type FinancialDetailField,
} from "@/features/financial-records/FinancialDetailPrimitives";
import styles from "./RenderView.module.css";

const STATUS_TEXT: Record<string, string> = {
  I: "Pago parcial",
  P: "Cobrado",
};

const RenderView = ({
  open,
  onClose,
  item: propItem,
  reLoad,
  execute,
  extraData,
  showToast,
}: any) => {
  const { user } = useAuth();
  const [openDetail, setOpenDetail] = useState<{
    open: boolean;
    item?: any;
  }>({ open: false });
  const [openFormAccount, setOpenFormAccount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [item, setItem] = useState<any>({});
  const [openConfirmDel, setOpenConfirmDel] = useState(false);
  const [loadingExport, setLoadingExport] = useState(false);

  const getDetail = async () => {
    if (!propItem?.id) return;

    setLoading(true);
    const { data: response } = await execute(
      paymentsApi.partialSummary(propItem.id),
      "GET",
      {},
      false,
      true,
    );

    if (response?.success) {
      setItem({ ...response.data?.debt, history: response.data?.history || [] });
    } else {
      onClose();
      if (response?.success !== false) {
        showToast(response?.message || "Error al obtener los datos", "error");
      }
      reLoad?.();
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) void getDetail();
    // getDetail intentionally follows the currently selected record.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, propItem?.id]);

  const confirmedPayments = Array.isArray(item?.history)
    ? item.history.filter((payment: any) => payment.status === "P")
    : [];
  const totalPaid = confirmedPayments.reduce(
    (sum: number, payment: any) => sum + Number(payment.amount || 0),
    0,
  );
  const debtAmount = Number(item?.amount || 0);
  const penaltyAmount = Number(item?.penalty_amount || 0);
  const maintenanceAmount = hasMaintenanceValue(user)
    ? Number(item?.maintenance_amount || 0)
    : 0;
  const totalAmount = debtAmount + penaltyAmount + maintenanceAmount;
  const apiRemaining = Number(
    item?.available_partial_amount ?? item?.total_remaining_amount,
  );
  const remainingAmount = Number.isFinite(apiRemaining)
    ? apiRemaining
    : Math.max(totalAmount - totalPaid, 0);
  const historyRows = Array.isArray(item?.history) ? item.history : [];
  const historyVisibleRows = Math.min(Math.max(historyRows.length || 1, 1), 4);
  const historyTableHeight = `${historyVisibleRows * 56}`;

  const downloadAllVouchers = (files: any) => {
    let urls: string[] = [];

    if (Array.isArray(files) && typeof files[0] === "string") {
      urls = files;
    } else if (Array.isArray(files)) {
      urls = files.flatMap((file) => file.files || []);
    }

    urls.forEach((url) => {
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.target = "_blank";
      anchor.download = url.split("/").pop() || "comprobante";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    });
  };

  const getExport = async () => {
    setLoadingExport(true);
    const { data: file, error } = await execute(
      paymentsApi.partialReceipt(propItem?.id),
      "POST",
      {},
      false,
      true,
    );
    if (file?.success === true && file?.data?.path) {
      const receiptUrl = getUrlImages("/" + file.data.path);
      window.open(receiptUrl, "_blank");
      showToast("Recibo generado con éxito.", "success");
    } else {
      showToast(
        error?.data?.message || "No se pudo generar el recibo.",
        "error",
      );
    }
    setLoadingExport(false);
  };

  const header = [
    {
      key: "paid_by",
      label: "Pagado por",
      responsive: "onlyDesktop",
      onRender: ({ item: payment }: any) =>
        getFullName(payment?.user) || getFullName(payment?.owner),
    },
    {
      key: "paid_at",
      label: "Fecha de pago",
      responsive: "onlyDesktop",
      onRender: ({ item: payment }: any) => getDateStrMes(payment?.paid_at),
    },
    {
      key: "receipt",
      label: "Comprobante",
      responsive: "onlyDesktop",
      onRender: ({ item: payment }: any) =>
        payment?.files?.length > 0 ? (
          <div className={styles.receiptCell}>
            <div className={styles.receiptIcon}>
              <IconGallery color="var(--cWhite)" />
            </div>
            <div>
              <p className={styles.receiptCode}>{payment?.code}</p>
              <button
                type="button"
                className={styles.receiptLink}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  downloadAllVouchers(payment.files);
                }}
              >
                Ver imagen
              </button>
            </div>
          </div>
        ) : (
          <p className={styles.emptyValue}>-/-</p>
        ),
    },
    {
      key: "status",
      label: "Estado",
      width: "180px",
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
      responsive: "onlyDesktop",
      onRender: ({ item: payment }: any) => {
        const info = getPaymentStatusConfig(payment?.status);
        return (
          <StatusBadge
            color={info.color}
            backgroundColor={info.backgroundColor}
          >
            {info.label}
          </StatusBadge>
        );
      },
    },
    {
      key: "amount",
      width: "120px",
      label: "Subtotal",
      className: styles.amountColumn,
      responsive: "onlyDesktop",
      onRender: ({ item: payment }: any) => formatBs(payment?.amount),
    },
  ];

  const concept =
    Number(item?.type) === 1
      ? `Pago de expensa - ${MONTHS[item?.debt?.month] || ""}, ${item?.debt?.year || ""}`
      : Number(item?.type) === 2
        ? item?.description
        : item?.subcategory?.name;
  const homeowner = getFullName(item?.dpto?.homeowner) || "-/-";
  const holder =
    getFullName(item?.dpto?.tenant) ||
    getFullName(item?.dpto?.homeowner) ||
    "-/-";
  const unit =
    [item?.dpto?.type?.name, item?.dpto?.nro].filter(Boolean).join(" ") ||
    "-/-";
  const fields: FinancialDetailField[] = [
    { id: "concept", label: "Concepto", value: concept || "-/-", wide: true },
    { id: "unit", label: "Unidad", value: unit },
    { id: "homeowner", label: "Propietario", value: homeowner },
    { id: "holder", label: "Titular", value: holder },
    {
      id: "status",
      label: "Estado",
      value: STATUS_TEXT[item?.status] || item?.status || "-/-",
      tone: item?.status === "P" ? "success" : "warning",
    },
    { id: "debt", label: "Deuda", value: formatBs(debtAmount) },
    { id: "penalty", label: "Multa", value: formatBs(penaltyAmount) },
    ...(hasMaintenanceValue(user)
      ? [
          {
            id: "maintenance",
            label: "Mantenimiento de valor",
            value: formatBs(maintenanceAmount),
          } satisfies FinancialDetailField,
        ]
      : []),
    { id: "total", label: "Monto total", value: formatBs(totalAmount) },
    { id: "paid", label: "Total pagado", value: formatBs(totalPaid) },
    {
      id: "remaining",
      label: "Saldo restante",
      value: formatBs(remainingAmount),
      tone: remainingAmount > 0 ? "warning" : "success",
    },
  ];

  const footer = (
    <div className={styles.actionsRow}>
      <Button
        disabled={loadingExport}
        onClick={() => void getExport()}
        variant="secondary"
        className={styles.growButton}
      >
        {loadingExport ? "Generando…" : "Ver recibo"}
      </Button>
      {item?.status === "I" && (
        <Button
          onClick={() => setOpenFormAccount(true)}
          className={styles.growButton}
        >
          Registrar pago a cuenta
        </Button>
      )}
    </div>
  );

  const hasChildModal = openDetail.open || openFormAccount || openConfirmDel;

  return (
    <>
      <FinancialDetailModal
        open={open && !hasChildModal}
        onClose={onClose}
        title="Detalle de pago parcial"
        description="Saldo, pagos aplicados, comprobantes e historial de correcciones de la deuda."
        record={{
          type: "debt",
          id: item?.id ?? propItem?.id,
          penaltyAmount,
        }}
        summary={{
          amount: formatBs(remainingAmount),
          eyebrow: item?.status === "P" ? "Deuda cobrada" : "Saldo pendiente",
          date: concept || "-/-",
          status: {
            label: STATUS_TEXT[item?.status] || item?.status || "Cargando…",
            tone: item?.status === "P" ? "success" : "warning",
          },
        }}
        loading={loading || !item?.id}
        onRecordChanged={getDetail}
        footer={footer}
      >
        <FinancialDetailSection title="Resumen de la deuda">
          <FinancialDetailGrid fields={fields} />
        </FinancialDetailSection>

        <FinancialDetailSection
          title="Pagos aplicados"
          description="Selecciona una fila para abrir el comprobante individual."
        >
          <div className={styles.tableWrapper}>
            <Table
              style={{
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
              }}
              className="striped"
              height={historyTableHeight}
              onRowClick={(payment: any) => {
                setOpenDetail({ open: true, item: payment });
              }}
              data={historyRows}
              header={header}
            />
            <div className={styles.tableFooter}>
              <div className={styles.tableFooterLabels}>
                <p>Total pagado</p>
                <p>Saldo restante</p>
              </div>
              <div className={styles.tableFooterValues}>
                <p className={styles.footerValue}>{formatBs(totalPaid)}</p>
                <p className={styles.footerValue}>{formatBs(remainingAmount)}</p>
              </div>
            </div>
          </div>
        </FinancialDetailSection>
      </FinancialDetailModal>

      {openDetail.open && (
        <RenderViewPayment
          open={openDetail.open}
          onClose={() => setOpenDetail({ open: false })}
          payment_id={openDetail.item?.payment_id as string}
          onDel={() => setOpenConfirmDel(true)}
        />
      )}

      {openFormAccount && (
        <RenderFormAccount
          open={openFormAccount}
          onClose={() => setOpenFormAccount(false)}
          item={{
            dpto_id: item?.dpto?.nro,
            amount: Number(
              item?.available_partial_amount ??
                item?.total_remaining_amount ??
                0,
            ),
            debt_dpto_id: item?.id ?? propItem?.id,
            bank_account_id: item?.subcategory?.bank_account_id,
            type: "O",
            max_amount: Number(
              item?.available_partial_amount ??
                item?.total_remaining_amount ??
                0,
            ),
          }}
          reLoad={getDetail}
          execute={execute}
          showToast={showToast}
          extraData={extraData}
        />
      )}

      {openConfirmDel && (
        <RenderDel
          open={openConfirmDel}
          onClose={() => setOpenConfirmDel(false)}
          execute={execute}
          item={{ ...openDetail.item, id: openDetail.item?.payment_id }}
          reLoad={getDetail}
        />
      )}
    </>
  );
};

export default RenderView;
