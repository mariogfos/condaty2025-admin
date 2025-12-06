import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Table from "@/mk/components/ui/Table/Table";
import { formatBs } from "@/mk/utils/numbers";
import React, { useState } from "react";
import { useAuth } from "@/mk/contexts/AuthProvider";
import Button from "@/mk/components/forms/Button/Button";
import { IconGallery } from "@/components/layout/icons/IconsBiblioteca";
import RenderViewPayment from "@/modulos/Payments/RenderView/RenderView";
import { getPaymentStatusConfig } from "@/types/payment";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";

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
  W: "var(--cCompl5)",
};
const statusText: any = {
  W: "Pago parcial",
  P: "Cobrado",
};
const RenderView = ({ open, onClose, item: propItem, onDel, onEdit }: any) => {
  const { user } = useAuth();
  const [openDetail, setOpenDetail] = useState({
    open: false,
    item: undefined,
  });
  const item = {
    id: "exp-2025-11-00124",
    amount: 1850.0, // Monto original de la expensa
    penalty_amount: 370.0, // Multa por mora (20%)
    forgiveness_amount: 277.5, // Condonación del 15% de la multa
    forgiveness_percent: "15.00",
    status: "W", // P = Parcialmente pagado
    due_at: "2025-11-10", // Fecha límite original
    paid_amount: 1200.0, // Ya pagado
    remaining_amount: 1020.0, // Saldo pendiente (amount + penalty - forgiveness - paid)
    maintenance_amount: 277.5, // Mantenimiento del 15% de la multa
    unit: "Departamento 24-B",
    owner: "Carlos Delgadillo Flores",
    holder: "Marcelo Peña Galvarro",
    note: "Pagó la hermana del propietario",
    authorized_by: "Scarlett Guzmán V.",
    debts: [
      {
        id: "a085ae50-2449-434a-b9db-7102c76a0761",
        paid_by: "Scarlett Guzmán V.",
        paid_at: "2025-11-15",
        receipt: "REC-2025-0891",
        status: "A", // Aprobado
        amount: 800.0,
      },
      {
        id: "a085ae50-2449-434a-b9db-7102c76a0761",
        paid_by: "Marcelo Peña Galvarro",
        paid_at: "2025-11-28",
        receipt: "REC-2025-1124",
        status: "A",
        amount: 400.0,
      },
      {
        id: "a085ae50-2449-434a-b9db-7102c76a0761",
        paid_by: "Carlos Delgadillo Flores",
        paid_at: "2025-12-02",
        receipt: "REC-2025-1340",
        status: "P", // Pendiente de revisión
        amount: 200.0,
      },
      {
        id: "a085ae50-2449-434a-b9db-7102c76a0761",
        paid_by: "Scarlett Guzmán V.",
        paid_at: "2025-12-02",
        receipt: "REC-2025-1340",
        status: "P", // Pendiente de revisión
        amount: 200.0,
      },
    ],
  };

  const header = [
    {
      key: "paid_by",
      label: "Pagado por",
      responsive: "onlyDesktop",
      onRender: ({ item }: any) => item?.paid_by,
    },
    {
      key: "paid_at",
      label: "Fecha de pago",
      responsive: "onlyDesktop",
      onRender: ({ item }: any) => item?.paid_at,
    },
    {
      key: "receipt",
      label: "Comprobante",
      responsive: "onlyDesktop",
      onRender: ({ item }: any) => (
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
            <p style={{ color: "var(--cWhite)" }}>{item?.receipt}</p>
            <a style={{ color: "var(--cAccent)", fontSize: 12 }} href="">
              Ver imagen
            </a>
          </div>
        </div>
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

  const totalPagado = item.debts.reduce(
    (acc: number, d: any) => acc + d.amount,
    0
  );
  const totalDeuda =
    item.amount + item.penalty_amount + item.maintenance_amount;
  const saldoRestante = totalDeuda - totalPagado;
  return (
    <>
      <DataModal
        title="Detalle de condonación"
        open={open}
        onClose={() => {
          onClose();
        }}
        buttonText=""
        buttonCancel=""
        buttonExtra={
          <div style={{ display: "flex", gap: 16, width: "100%" }}>
            <Button
              onClick={() => onEdit(item)}
              variant="secondary"
              style={{ flex: 1 }}
            >
              Ver recibo
            </Button>

            <Button onClick={() => onDel(item)} style={{ flex: 1 }}>
              Registrar pago a cuenta
            </Button>
          </div>
        }
        variant={"mini"}
      >
        <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
          <div
            style={{
              backgroundColor: "#323232",
              padding: 16,
              borderRadius: 16,
              border: "1px solid var(--cWhiteV5)",
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
              {formatBs(item?.amount)}
            </p>
            <p
              style={{
                color: "var(--cWhiteV1)",
                fontSize: 16,
                textAlign: "center",
              }}
            >
              Pago de expensa - Noviembre, 2025
            </p>
          </div>
          <div
            style={{
              backgroundColor: "#323232",
              padding: 16,
              borderRadius: 16,
              border: "1px solid var(--cWhiteV5)",
              display: "flex",
              gap: 16,
            }}
          >
            <LabelValue label="Deuda" value={formatBs(item?.amount)} />
            <LabelValue label="Multa" value={formatBs(item?.penalty_amount)} />
            <LabelValue
              label="Mant. de Valor"
              value={formatBs(item?.maintenance_amount)}
            />
          </div>

          <div
            style={{
              backgroundColor: "#323232",
              padding: 16,
              borderRadius: 16,
              border: "1px solid var(--cWhiteV5)",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
              <LabelValue
                label="Estado"
                value={statusText[item?.status]}
                styleValue={{ color: statusColor[item?.status] }}
              />
              <LabelValue label="Autorizado por:" value="Scarlett Guzmán V." />
              <LabelValue
                label="Nota:"
                value="Pagó la hermana del propietario"
              />
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <LabelValue label="Unidad" value="Departamento 24-B" />
              <LabelValue
                label="Propietario:"
                value="Carlos Delgadillo Flores"
              />
              <LabelValue label="Titular:" value="Marcelo Peña Galvarro" />
            </div>
          </div>
          <div>
            <Table
              style={{
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
              }}
              height="calc(100vh - 700px)"
              onRowClick={(item: any) => {
                setOpenDetail({ open: true, item });
              }}
              data={item.debts}
              header={header}
            />
            <div
              style={{
                padding: 16,
                borderBottomLeftRadius: 12,
                borderBottomRightRadius: 12,
                border: "0.5px solid var(--cWhiteV1)",
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
      </DataModal>
      {openDetail.open && (
        <RenderViewPayment
          open={openDetail.open}
          onClose={() => setOpenDetail({ open: false, item: undefined })}
          item={openDetail?.item}
          onDel={onDel}
        />
      )}
    </>
  );
};

export default RenderView;
