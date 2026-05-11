import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Table from "@/mk/components/ui/Table/Table";
import { formatBs } from "@/mk/utils/numbers";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/mk/contexts/AuthProvider";
import Button from "@/mk/components/forms/Button/Button";
import { IconGallery } from "@/components/layout/icons/IconsBiblioteca";
import RenderViewPayment from "@/modulos/Payments/RenderView/RenderView";
import { getPaymentStatusConfig } from "@/types/payment";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import RenderFormAccount from "../RenderFormAccount/RenderFormAccount";
import { getDateStrMes } from "../../../mk/utils/date";
import { getFullName, getUrlImages } from "../../../mk/utils/string";
import { hasMaintenanceValue } from "@/mk/utils/utils";
import Loading from "@/mk/components/ui/LoadingScreen/Loading/Loading";
import { MONTHS, MONTHS_S } from "@/mk/utils/date1";
import RenderDel from "@/modulos/Payments/RenderDel/RenderDel";
import { shouldIgnoreValueTranslationContext } from "@/i18n/translationGuards";
import styles from "./RenderView.module.css";

const LabelValue = ({
  label,
  value,
  style,
  styleValue,
  styleLabel,
}: {
  label: string;
  value: string | React.ReactNode;
  styleValue?: React.CSSProperties;
  style?: React.CSSProperties;
  styleLabel?: React.CSSProperties;
}) => {
  const ignoreValueTranslation = shouldIgnoreValueTranslationContext({ label });

  return (
    <div className={styles.labelValue} style={style}>
      <p className={styles.labelText} style={styleLabel}>
        {label}
      </p>
      {typeof value == "string" ? (
        <p
          data-i18n-ignore={ignoreValueTranslation ? "true" : undefined}
          className={styles.valueText}
          style={styleValue}
        >
          {value}
        </p>
      ) : (
        value
      )}
    </div>
  );
};

const statusColor: any = {
  P: "var(--cSuccess)",
  I: "var(--cMediumAlert)",
};
const statusText: any = {
  I: "Pago parcial",
  P: "Cobrado",
};
const RenderView = ({
  open,
  onClose,
  item: propItem,
  // onDel,
  onEdit,
  reLoad,
  execute,
  extraData,
  showToast,
}: any) => {
  const { user } = useAuth();
  const [openDetail, setOpenDetail]: any = useState({
    open: false,
    item: null,
  });
  const [openFormAccount, setOpenFormAccount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [item, setItem]: any = useState({});
  const [openConfimDel, setOpenConfimDel] = useState(false);
  const [loadingExport, setLoadingExport] = useState(false);
  const header = [
    {
      key: "paid_by",
      label: "Pagado por",
      responsive: "onlyDesktop",
      onRender: ({ item }: any) =>
        getFullName(item?.user) || getFullName(item?.owner),
    },
    {
      key: "paid_at",
      label: "Fecha de pago",
      responsive: "onlyDesktop",
      onRender: ({ item }: any) => getDateStrMes(item?.paid_at),
    },
    {
      key: "receipt",
      label: "Comprobante",
      responsive: "onlyDesktop",
      onRender: ({ item }: any) =>
        item?.files?.length > 0 ? (
          <div className={styles.receiptCell}>
            <div className={styles.receiptIcon}>
              <IconGallery color="var(--cWhite)" />
            </div>
            <div>
              <p className={styles.receiptCode}>{item?.code}</p>
              <div
                className={styles.receiptLink}
                onClick={(e: any) => {
                  e.preventDefault();
                  e.stopPropagation();
                  downloadAllVouchers(item.files);
                }}
              >
                Ver imagen
              </div>
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
      onRender: ({ item }: any) => {
        const info = getPaymentStatusConfig(item?.status);

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
      onRender: ({ item }: any) => formatBs(item?.amount),
    },
  ];
  const getDetail = async () => {
    if (propItem?.id) {
      setLoading(true);
      const { data: res } = await execute(
        `/partialpayments`,
        "GET",
        {
          fullType: "DET",
          debtDptoId: propItem?.id,
        },
        false,
        true,
      );

      if (res?.success) {
        setItem({ ...res?.data?.debt, history: res?.data?.history });
      } else {
        onClose();
        if (res.success !== false) {
          showToast(res?.message || "Error al obtener los datos", "error");
        }
        reLoad();
      }
      setLoading(false);
    }
  };
  useEffect(() => {
    getDetail();
  }, [propItem?.id]);
  const totalPagado = item?.history
    ?.filter((d: any) => d.status == "P")
    ?.reduce((acc: number, d: any) => acc + Number(d.amount), 0);

  const totalAmount =
    Number(item?.amount) +
    Number(item?.penalty_amount) +
    Number(hasMaintenanceValue(user) ? item?.maintenance_amount || "0" : "0");
  const saldoRestante = Number(totalAmount) - Number(totalPagado);
  const historyRows = Array.isArray(item?.history) ? item.history.length : 0;
  const historyVisibleRows = Math.min(Math.max(historyRows || 1, 1), 4);
  const historyTableHeight = `${historyVisibleRows * 56}`;

  const downloadAllVouchers = (files: any) => {
    let urls = [];

    if (Array.isArray(files) && typeof files[0] === "string") {
      urls = files;
    } else if (Array.isArray(files)) {
      urls = files.flatMap((f) => f.files || []);
    }
    urls.forEach((url) => {
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.download = url.split("/").pop();
      document.body.appendChild(a);
      a.click();
      a.remove();
    });
  };

  const getExport = async () => {
    setLoadingExport(true);
    const { data: file, error } = await execute(
      `/payment-recibo-parcial`,
      "POST",
      {
        id: propItem?.id,
      },
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

  const onDelPayment = () => {
    setOpenConfimDel(true);
  };

  return (
    <>
      <DataModal
        title="Detalle de pago parcial"
        minWidth={"980px"}
        open={open}
        onClose={() => {
          onClose();
        }}
        buttonText=""
        buttonCancel=""
        buttonExtra={
          <div className={styles.actionsRow}>
            <Button
              disabled={loadingExport}
              onClick={() => getExport()}
              variant="secondary"
              className={styles.growButton}
            >
              Ver recibo
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
        }
        variant={"mini"}
      >
        {loading ? (
          <Loading />
        ) : (
          <div className={styles.root}>
            <div className={`${styles.card} ${styles.summaryCard}`}>
              <p className={styles.summaryAmount}>
                {formatBs(totalAmount)}
              </p>
              <p className={styles.summarySubtitle}>
                {item.type === 1 &&
                  "Pago de expensa - " +
                    MONTHS[item.debt.month] +
                    ", " +
                    item.debt.year}

                {item.type === 2 && item.description}
                {item.type === 0 && item.subcategory?.name}
              </p>
            </div>
            <div className={`${styles.card} ${styles.infoGrid}`}>
              <LabelValue label="Deuda" value={formatBs(item?.amount)} />
              <LabelValue
                label="Multa"
                value={formatBs(item?.penalty_amount)}
              />
              {hasMaintenanceValue(user) && (
                <LabelValue
                  label={"Mant. de Valor"}
                  value={formatBs(item?.maintenance_amount)}
                />
              )}
            </div>

            <div className={styles.card}>
              <div className={styles.metaGrid}>
                <LabelValue
                  label="Estado"
                  value={statusText[item?.status]}
                  styleValue={{
                    color: statusColor[item?.status],
                    fontWeight: 600,
                  }}
                />
                <LabelValue
                  label="Autorizado por:"
                  value={getFullName(item?.history?.[0]?.user) || "-/-"}
                />
                {/* <LabelValue
                label="Nota:"
                value="Pagó la hermana del propietario"
              /> */}
                <LabelValue
                  label="Propietario:"
                  value={getFullName(item?.dpto?.homeowner) || "-/-"}
                />
                <LabelValue
                  label="Unidad"
                  value={item?.dpto?.type?.name + " " + item?.dpto?.nro}
                />

                <LabelValue
                  label="Titular:"
                  value={getFullName(item?.dpto?.tenant) || "-/-"}
                />
              </div>
            </div>
            <div className={styles.tableWrapper}>
              <Table
                style={{
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                }}
                className="striped"
                height={historyTableHeight}
                onRowClick={(item: any) => {
                  setOpenDetail({ open: true, item });
                }}
                data={item?.history}
                header={header}
              />
              <div className={styles.tableFooter}>
                <div className={styles.tableFooterLabels}>
                  <p>Total pagado</p>
                  <p>Saldo restante</p>
                </div>
                <div className={styles.tableFooterValues}>
                  <p className={styles.footerValue}>{formatBs(totalPagado)}</p>
                  <p className={styles.footerValue}>
                    {formatBs(saldoRestante)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </DataModal>
      {openDetail.open && (
        <RenderViewPayment
          open={openDetail.open}
          onClose={() => setOpenDetail({ open: false, item: undefined })}
          payment_id={openDetail.item?.payment_id as string}
          // item={openDetail?.item}
          onDel={onDelPayment}
        />
      )}
      {openFormAccount && (
        <RenderFormAccount
          open={openFormAccount}
          onClose={() => setOpenFormAccount(false)}
          item={{
            dpto_id: item?.dpto?.nro,
            // amount: item?.remaining_amount,
            amount:
              parseFloat(item?.remaining_amount) +
              parseFloat(item?.penalty_amount) +
              parseFloat(
                hasMaintenanceValue(user)
                  ? item?.maintenance_amount || "0"
                  : "0",
              ),
            debt_dpto_id: item?.id ?? propItem?.id,
            bank_account_id: item?.subcategory?.bank_account_id,
            type: "O",
          }}
          reLoad={() => {
            getDetail();
          }}
          execute={execute}
          showToast={showToast}
          extraData={extraData}
        />
      )}
      {openConfimDel && (
        <RenderDel
          open={openConfimDel}
          onClose={() => setOpenConfimDel(false)}
          execute={execute}
          item={{ ...openDetail?.item, id: openDetail?.item?.payment_id }}
          reLoad={() => {
            getDetail();
          }}
        />
      )}
    </>
  );
};

export default RenderView;
