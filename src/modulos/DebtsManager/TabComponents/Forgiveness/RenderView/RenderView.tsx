import Br from "@/components/Detail/Br";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Table from "@/mk/components/ui/Table/Table";
import { getDateStrMesShort } from "@/mk/utils/date";
import { formatBs } from "@/mk/utils/numbers";
import { getFullName } from "@/mk/utils/string";
import React from "react";
import { colorStatusForgiveness, statusForgiveness } from "../constans";

const LabelValue = ({
  label,
  value,
  variant = "V1",
  styleValue,
  styleLabel,
}: {
  label: string;
  value: string;
  variant?: string;
  styleValue?: React.CSSProperties;
  styleLabel?: React.CSSProperties;
}) => {
  if (variant == "V1") {
    return (
      <p style={{ color: "var(--cWhiteV1)", flex: 1, ...styleLabel }}>
        {label}:{" "}
        <span style={{ color: "var(--cWhite)", ...styleValue }}>{value}</span>
      </p>
    );
  }
  if (variant == "V2") {
    return (
      <div style={{ flex: 1 }}>
        <p style={{ color: "var(--cWhiteV1)", ...styleLabel }}>{label}</p>
        <p style={{ color: "var(--cWhite)", ...styleValue }}>{value}</p>
      </div>
    );
  }
};

const RenderView = ({
  open,
  onClose,
  item,
  setItem,
  execute,
  extraData,
  user,
  reLoad,
}: any) => {
  const forgiveness = [
    {
      id: 52,
      description: "Deuda de expensa",
      amount: "641.00",
      penalty_amount: "32.05",
      maintenance_amount: "55.08",
      subcategory_id: 2,
      pivot: {
        debt_dpto_id: 251,
        forgiven_debt_dpto_id: 52,
      },
      subcategory: {
        id: 2,
        name: "Expensas",
      },
    },
    {
      id: 227,
      description: "Deuda de expensa",
      amount: "641.00",
      penalty_amount: "32.05",
      maintenance_amount: "47.44",
      subcategory_id: 2,
      pivot: {
        debt_dpto_id: 251,
        forgiven_debt_dpto_id: 227,
      },
      subcategory: {
        id: 2,
        name: "Expensas",
      },
    },
  ];
  const header = [
    {
      key: "amount",
      label: "Deuda",
      responsive: "onlyDesktop",
      onRender: ({ item }: any) => {
        console.log(item);
        return formatBs(item?.amount);
      },
    },
    {
      key: "subcategory",
      label: "Categoría",
      responsive: "onlyDesktop",
      onRender: ({ item }: any) => {
        return item?.subcategory?.name;
      },
    },
    {
      key: "maintenance_amount",
      label: "Mant. valor",
      responsive: "onlyDesktop",
      onRender: ({ item }: any) => {
        return formatBs(item?.maintenance_amount);
      },
    },
    {
      key: "penalty_amount",
      label: "Multa",
      responsive: "onlyDesktop",
      onRender: ({ item }: any) => {
        return formatBs(item?.penalty_amount);
      },
    },
  ];
  console.log(item);
  return (
    <DataModal title="Detalle de condonación" open={open} onClose={onClose}>
      <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
        <LabelValue
          label="Fecha de creación"
          value={getDateStrMesShort(item?.created_at)}
        />
        <LabelValue
          label="Fecha inicio"
          value={getDateStrMesShort(item?.begin_at)}
        />
        <LabelValue label="Creado por" value={item?.id} />
      </div>
      <div style={{ display: "flex", gap: 16 }}>
        <LabelValue
          label="Estado"
          value={statusForgiveness[item?.status]}
          styleValue={{
            backgroundColor: colorStatusForgiveness[item?.status].bg,
            color: colorStatusForgiveness[item?.status].color,
            padding: "6px 10px",
            borderRadius: 14,
          }}
        />
        <LabelValue
          label="Vencimiento"
          value={getDateStrMesShort(item?.due_at)}
        />
        <LabelValue label="Aprobado por" value={item?.id} />
      </div>
      <Br />

      <div style={{ display: "flex", gap: 16 }}>
        <LabelValue label="Unidad" value={item?.dpto?.nro} variant="V2" />
        <LabelValue
          label="Titular"
          value={
            item?.dpto?.holder == "H"
              ? getFullName(item?.dpto?.homeowner)
              : getFullName(item?.dpto?.tenant)
          }
          variant="V2"
        />
        <LabelValue
          label="Propietario"
          value={
            item?.dpto?.holder == "H"
              ? getFullName(item?.dpto?.homeowner)
              : getFullName(item?.dpto?.tenant)
          }
          variant="V2"
        />
      </div>

      <Table data={forgiveness} header={header} />
    </DataModal>
  );
};

export default RenderView;
