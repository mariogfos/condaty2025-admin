"use client";

import { useEffect, useState } from "react";
import { getFullName } from "@/mk/utils/string";
import { getDateStrMes, MONTHS_S } from "@/mk/utils/date";
import PaymentRenderView from "@/modulos/Payments/RenderView/RenderView";
import { formatBs } from "@/mk/utils/numbers";
import { getTitular } from "@/mk/utils/adapters";
import Table from "@/mk/components/ui/Table/Table";
import { paymentsApi } from "@/modulos/Payments/api";
import Button from "@/mk/components/forms/Button/Button";
import { FinancialDetailModal } from "@/features/financial-records/FinancialDetailModal";
import {
  FinancialDetailGrid,
  FinancialDetailSection,
  type FinancialDetailField,
} from "@/features/financial-records/FinancialDetailPrimitives";
import styles from "./RenderView.module.css";

const RenderView = (props: {
  open: boolean;
  onClose: () => void;
  item: Record<string, any>;
  execute: Function;
}) => {
  const [openPayment, setOpenPayment] = useState(false);
  const [item, setItem] = useState(props.item);
  const [resolvedPaymentId, setResolvedPaymentId] = useState<
    string | number | null
  >(props.item?.payment_id || null);

  const refreshResolvedPayment = async (debtId: string | number) => {
    const { data } = await props.execute(
      paymentsApi.resolvedPayment(debtId),
      "GET",
      {},
      false,
      true,
    );

    if (data?.success) {
      setResolvedPaymentId(data?.data?.payment_id || null);
    }
  };

  useEffect(() => {
    setItem(props.item);
    setResolvedPaymentId(props.item?.payment_id || null);
  }, [props.item]);

  useEffect(() => {
    if (!props.open || !props.item?.id) return;
    void refreshResolvedPayment(props.item.id);
    // execute is stable within the active CRUD screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.open, props.item?.id]);

  const reloadItem = async () => {
    const debtId = item?.id ?? props.item?.id;
    if (!debtId) return;

    const { data } = await props.execute(
      "/debt-dptos",
      "GET",
      {
        fullType: "DET",
        searchBy: debtId,
        page: 1,
        perPage: 1,
      },
      false,
      true,
    );
    const detail = Array.isArray(data?.data) ? data.data[0] : data?.data;
    if (data?.success && detail) {
      setItem(detail);
    }
    await refreshResolvedPayment(debtId);
  };

  const getStatus = (detail: any) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (detail?.status === "A" && detail?.due_at) {
      const dueDate = new Date(detail.due_at);
      if (today > dueDate) return { text: "En mora", code: "M" };
    }

    const statuses: Record<string, string> = {
      A: "Por cobrar",
      P: "Cobrado",
      S: "Por confirmar",
      M: "En mora",
      F: "Condonada",
      X: "Anulada",
    };
    return {
      text: statuses[detail?.status] || detail?.status || "Desconocido",
      code: detail?.status || "",
    };
  };

  const titular = getTitular(item?.dpto);
  const pendingPeriods = Array.isArray(item?.pendingPeriods)
    ? item.pendingPeriods
    : [];
  const pendingPeriodsTableHeight = `${
    Math.min(Math.max(pendingPeriods.length || 1, 1), 4) * 56
  }`;
  const status = getStatus(item);
  const debtAmount = Number(item?.amount || 0);
  const maintenanceAmount = Number(item?.maintenance_amount || 0);
  const penaltyAmount = Number(item?.penalty_amount || 0);
  const totalAmount = debtAmount + maintenanceAmount + penaltyAmount;
  const period =
    item?.debt?.month && item?.debt?.year
      ? `${MONTHS_S[item.debt.month]}/${item.debt.year}`
      : "-/-";

  const fields: FinancialDetailField[] = [
    { id: "unit", label: "Unidad", value: item?.dpto?.nro || "Sin unidad" },
    { id: "period", label: "Periodo", value: period },
    { id: "due-at", label: "Fecha de plazo", value: getDateStrMes(item?.due_at) },
    { id: "holder", label: "Titular", value: getFullName(titular) || "-/-" },
    {
      id: "status",
      label: "Estado",
      value: status.text,
      tone:
        status.code === "P"
          ? "success"
          : status.code === "M" || status.code === "X"
            ? "danger"
            : "warning",
    },
    {
      id: "paid-at",
      label: "Fecha de pago",
      value: getDateStrMes(item?.paid_at) || "-/-",
    },
    {
      id: "description",
      label: "Descripción de unidad",
      value: item?.dpto?.description || "-/-",
    },
    {
      id: "homeowner",
      label: "Propietario",
      value: getFullName(item?.dpto?.homeowner) || "-/-",
    },
    { id: "principal", label: "Deuda", value: formatBs(debtAmount) },
    { id: "penalty", label: "Multa", value: formatBs(penaltyAmount) },
    {
      id: "maintenance",
      label: "Mantenimiento de valor",
      value: formatBs(maintenanceAmount),
    },
    { id: "total", label: "Monto total", value: formatBs(totalAmount) },
  ];

  const pendingPeriodsHeader = [
    {
      key: "period",
      label: "Periodo",
      width: "100%",
      onRender: ({ item: pending }: any) =>
        `${MONTHS_S[pending.month]}/${pending.year}`,
    },
    {
      key: "amount",
      label: "Monto",
      width: "124px",
      className: styles.amountColumn,
      onRender: ({ item: pending }: any) => formatBs(pending.amount),
    },
    {
      key: "penalty",
      label: "Multa",
      width: "124px",
      className: styles.amountColumn,
      onRender: ({ item: pending }: any) => formatBs(pending.penalty || 0),
    },
    {
      key: "subtotal",
      label: "Subtotal",
      width: "132px",
      className: styles.amountColumn,
      onRender: ({ item: pending }: any) =>
        formatBs(Number(pending.amount || 0) + Number(pending.penalty || 0)),
    },
  ];

  return (
    <>
      <FinancialDetailModal
        open={props.open && !openPayment}
        onClose={props.onClose}
        title="Detalle de expensa"
        description="Periodo, composición del monto, pago relacionado e historial de correcciones."
        record={{
          type: "debt",
          id: item?.id ?? props.item?.id,
          penaltyAmount,
        }}
        summary={{
          amount: formatBs(totalAmount),
          date: period,
          eyebrow: status.code === "P" ? "Monto cobrado" : "Monto por cobrar",
          status: {
            label: status.text,
            tone:
              status.code === "P"
                ? "success"
                : status.code === "M" || status.code === "X"
                  ? "danger"
                  : "warning",
          },
        }}
        onRecordChanged={reloadItem}
        footer={
          resolvedPaymentId ? (
            <Button onClick={() => setOpenPayment(true)}>Ver pago</Button>
          ) : null
        }
      >
        <FinancialDetailSection title="Datos de la expensa">
          <FinancialDetailGrid fields={fields} />
        </FinancialDetailSection>

        {pendingPeriods.length > 0 && (
          <FinancialDetailSection title="Periodos por pagar" defaultOpen={false}>
            <div className={styles.tableWrapper}>
              <Table
                className="striped"
                style={{
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                }}
                height={pendingPeriodsTableHeight}
                data={pendingPeriods}
                header={pendingPeriodsHeader as any}
              />
              <div className={styles.tableFooter}>
                <div className={styles.tableFooterLabels}>
                  <p>Total pagado</p>
                </div>
                <div className={styles.tableFooterValues}>
                  <p className={styles.footerValue}>{formatBs(item?.amount)}</p>
                </div>
              </div>
            </div>
          </FinancialDetailSection>
        )}
      </FinancialDetailModal>

      {openPayment && (
        <PaymentRenderView
          open={openPayment}
          onClose={() => {
            void reloadItem();
            setOpenPayment(false);
          }}
          payment_id={resolvedPaymentId as string | number}
          noWaiting
        />
      )}
    </>
  );
};

export default RenderView;
