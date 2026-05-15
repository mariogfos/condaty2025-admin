import DataModal from "@/mk/components/ui/DataModal/DataModal";
import styles from "./RenderView.module.css";
import { getFullName } from "@/mk/utils/string";
import { getDateStrMes, MONTHS_S } from "@/mk/utils/date";
import { useEffect, useState } from "react";
import { shouldIgnoreValueTranslationContext } from "@/i18n/translationGuards";

import PaymentRenderView from "../../../Payments/RenderView/RenderView";
import { formatBs } from "@/mk/utils/numbers";
import { getTitular } from "@/mk/utils/adapters";
import Table from "@/mk/components/ui/Table/Table";
import { paymentsApi } from "../../../Payments/api";

const RenderView = (props: {
  open: boolean;
  onClose: any;
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
    refreshResolvedPayment(props.item.id);
  }, [props.open, props.item?.id]);

  const reloadItem = async () => {
    const { data } = await props.execute(
      "/debt-dptos",
      "GET",
      {
        fullType: "DET",
        searchBy: item.id,
        page: 1,
        perPage: 1,
      },
      false,
      true,
    );
    if (data.success) {
      setItem({ ...data.data });
    }
    await refreshResolvedPayment(item.id);
  };
  const getStatus = (item: any) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (item.status === "A" && item.due_at) {
      const dueDate = new Date(item.due_at);
      if (today > dueDate) {
        return { text: "En mora", code: "M" };
      }
    }
    switch (item.status) {
      case "A":
        return { text: "Por cobrar", code: "A" };
      case "P":
        return { text: "Cobrado", code: "P" };
      case "S":
        return { text: "Por confirmar", code: "S" };
      case "M":
        return { text: "En mora", code: "M" };
      case "F":
        return { text: "Condonada", code: "F" };
      default:
        return { text: item.status || "Desconocido", code: item.status || "" };
    }
  };

  const colorStatus: any = {
    A: "var(--cInfo)",
    M: "var(--cError)",
    S: "var(--cWarning)",
    P: "var(--cSuccess)",
    F: "var(--cInfo)",
  };

  type InfoBlockProps = {
    value: string;
    label: string;
    colorValue?: string;
    className?: string;
  };

  const InfoBlock = ({
    value,
    label,
    colorValue,
    className,
  }: InfoBlockProps) => {
    const ignoreValueTranslation = shouldIgnoreValueTranslationContext({
      label,
    });

    return (
      <div className={`${styles.infoBlock} ${className}`}>
        <span className={styles.infoLabel}>{label}</span>
        <span
          data-i18n-ignore={ignoreValueTranslation ? "true" : undefined}
          className={styles.infoValue}
          style={{
            color: colorValue || "var(--cWhite)",
          }}
        >
          {value}
        </span>
      </div>
    );
  };
  const titular = getTitular(item.dpto);
  const pendingPeriods = Array.isArray(item?.pendingPeriods)
    ? item.pendingPeriods
    : [];
  const pendingPeriodsTableHeight = `${
    Math.min(Math.max(pendingPeriods.length || 1, 1), 4) * 56
  }`;
  const pendingPeriodsHeader = [
    {
      key: "period",
      label: "Periodo",
      width: "100%",
      onRender: ({ item: period }: any) =>
        `${MONTHS_S[period.month]}/${period.year}`,
    },
    {
      key: "amount",
      label: "Monto",
      width: "124px",
      className: styles.amountColumn,
      onRender: ({ item: period }: any) => formatBs(period.amount),
    },
    {
      key: "penalty",
      label: "Multa",
      width: "124px",
      className: styles.amountColumn,
      onRender: ({ item: period }: any) => formatBs(period.penalty || 0),
    },
    {
      key: "subtotal",
      label: "Subtotal",
      width: "132px",
      className: styles.amountColumn,
      onRender: ({ item: period }: any) =>
        formatBs(parseFloat(period.amount) + parseFloat(period.penalty || 0)),
    },
  ];

  return (
    <>
      <DataModal
        open={props.open}
        onClose={props?.onClose}
        title="Detalle de expensa"
        buttonText={resolvedPaymentId ? "Ver pago" : ""}
        onSave={resolvedPaymentId ? () => setOpenPayment(true) : undefined}
        buttonCancel=""
        variant={"mini"}
      >
        <div className={styles.container}>
          <div className={styles.headerSection}>
            <div className={styles.totalAmount}>
              {formatBs(
                (parseFloat(item?.amount || "0") || 0) +
                  (parseFloat(item?.maintenance_amount || "0") || 0) +
                  (parseFloat(item?.penalty_amount || "0") || 0),
              )}
            </div>
            <div className={styles.paymentDate}>
              {getDateStrMes(item?.paid_at) || "-/-"}
            </div>
          </div>

          <hr className={styles.sectionDivider} />

          <section className={styles.detailsSection}>
            <div className={styles.detailsColumn}>
              <InfoBlock
                label="Unidad"
                value={item?.dpto?.nro || "Sin unidad"}
              />

              <InfoBlock
                label="Periodo"
                value={MONTHS_S[item?.debt?.month] + "/" + item?.debt?.year}
              />

              <InfoBlock
                label="Fecha de plazo"
                value={getDateStrMes(item?.due_at)}
              />

              <InfoBlock
                label="Titular"
                value={getFullName(titular) || "-/-"}
              />
            </div>

            <div className={styles.detailsColumn}>
              <InfoBlock
                label="Estado"
                value={getStatus(item).text}
                colorValue={colorStatus[getStatus(item).code]}
              />

              <InfoBlock
                label="Fecha de pago"
                value={getDateStrMes(item?.paid_at) || "-/-"}
              />

              <InfoBlock
                label="Descripción"
                value={item?.dpto?.description || "-/-"}
              />

              <InfoBlock
                label="Propietario"
                value={getFullName(item?.dpto?.homeowner) || "-/-"}
              />
            </div>
          </section>

          {/* Sección de periodos por pagar si existen */}
          {pendingPeriods.length > 0 && (
            <>
              <hr className={styles.sectionDivider} />

              <div className={styles.periodsSection}>
                <div className={styles.periodsTitle}>Periodos por pagar</div>

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
                      <p className={styles.footerValue}>
                        {formatBs(item?.amount)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DataModal>
      {/* Modal de detalles de pago */}
      {openPayment && (
        <PaymentRenderView
          open={openPayment}
          onClose={() => {
            reloadItem();
            setOpenPayment(false);
          }}
          payment_id={resolvedPaymentId as string | number}
          noWaiting={true}
        />
      )}
    </>
  );
};

export default RenderView;
