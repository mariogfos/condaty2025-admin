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
  return (
    <div style={{ ...style, flex: 1 }}>
      <p style={{ color: "var(--cWhiteV1)", ...styleLabel }}>{label}</p>
      {typeof value == "string" ? (
        <p
          style={{
            color: "var(--cWhite)",
            marginTop: 8,
            fontWeight: "500",
            fontSize: 16,
            ...styleValue,
          }}
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
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div
              style={{
                backgroundColor: "#4F5659",
                padding: 8,
                borderRadius: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconGallery color="var(--cWhite)" />
            </div>
            <div>
              <p style={{ color: "var(--cWhite)" }}>{item?.code}</p>
              <div
                style={{ color: "var(--cAccent)", fontSize: 12 }}
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
          <p style={{ color: "var(--cWhite)" }}>-/-</p>
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
          <div style={{ display: "flex", gap: 16, width: "100%" }}>
            <Button
              disabled={loadingExport}
              onClick={() => getExport()}
              variant="secondary"
              style={{ flex: 1 }}
            >
              Ver recibo
            </Button>
            {item?.status === "I" && (
              <Button
                onClick={() => setOpenFormAccount(true)}
                style={{ flex: 1 }}
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
          <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
            <div
              style={{
                backgroundColor: "var(--cBackground)",
                padding: 16,
                borderRadius: 16,
                border: "1px solid var(--cBorder)",
              }}
            >
              <p
                style={{
                  color: "var(--cWhite)",
                  marginTop: 8,
                  fontSize: 36,
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                {formatBs(totalAmount)}
              </p>
              <p
                style={{
                  color: "var(--cWhiteV1)",
                  fontSize: 16,
                  textAlign: "center",
                }}
              >
                {item.type === 1 &&
                  "Pago de expensa - " +
                    MONTHS[item.debt.month] +
                    ", " +
                    item.debt.year}

                {item.type === 2 && item.description}
                {item.type === 0 && item.subcategory?.name}
              </p>
            </div>
            <div
              style={{
                backgroundColor: "var(--cBackground)",
                padding: 16,
                borderRadius: 16,
                border: "1px solid var(--cBorder)",
                display: "flex",
                gap: 16,
              }}
            >
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

            <div
              style={{
                backgroundColor: "var(--cBackground)",
                padding: 16,
                borderRadius: 16,
                border: "1px solid var(--cBorder)",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
                <LabelValue
                  label="Estado"
                  value={statusText[item?.status]}
                  styleValue={{ color: statusColor[item?.status] }}
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
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <LabelValue
                  label="Unidad"
                  value={item?.dpto?.type?.name + " " + item?.dpto?.nro}
                />

                <LabelValue
                  label="Titular:"
                  value={getFullName(item?.dpto?.tenant) || "-/-"}
                />
                <LabelValue label="" value={""} />
              </div>
            </div>
            <div>
              <Table
                style={{
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                  height: "auto",
                  // backgroundColor: "red",
                }}
                className="striped"
                height="150"
                onRowClick={(item: any) => {
                  setOpenDetail({ open: true, item });
                }}
                data={item?.history}
                header={header}
              />
              <div
                style={{
                  padding: 16,
                  borderBottomLeftRadius: 12,
                  borderBottomRightRadius: 12,
                  border: "1px solid var(--cBorder)",
                  borderTop: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 80,
                }}
              >
                <div style={{ textAlign: "right" }}>
                  <p>Total pagado</p>
                  <p>Saldo restante</p>
                </div>
                <div>
                  <p style={{ color: "var(--cWhite)" }}>
                    {formatBs(totalPagado)}
                  </p>
                  <p style={{ color: "var(--cWhite)" }}>
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
