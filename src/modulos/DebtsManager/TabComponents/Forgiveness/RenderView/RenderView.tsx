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
  style,
  styleValue,
  styleLabel,
}: {
  label: string;
  value: string;
  styleValue?: React.CSSProperties;
  style?: React.CSSProperties;
  styleLabel?: React.CSSProperties;
}) => {
  return (
    <div style={{ ...style, flex: 1 }}>
      <p style={{ color: "var(--cWhiteV1)", ...styleLabel }}>{label}</p>
      <p style={{ color: "var(--cWhite)", ...styleValue, marginTop: 8 }}>
        {value}
      </p>
    </div>
  );
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
      key: "Tipo",
      label: "Descripción",
      responsive: "onlyDesktop",
      onRender: ({ item }: any) => {
        return item?.description;
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
      key: "penalty_amount",
      label: "Multa",
      responsive: "onlyDesktop",
      onRender: ({ item }: any) => {
        return formatBs(item?.penalty_amount);
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
      key: "amount",
      label: "Total",
      responsive: "onlyDesktop",
      onRender: ({ item }: any) => {
        console.log(item);
        return formatBs(item?.amount);
      },
    },
  ];
  return (
    <DataModal title="Detalle de condonación" open={open} onClose={onClose}>
      <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
        <p
          style={{
            color: "var(--cWhiteV1)",
            fontSize: 16,
            textAlign: "center",
          }}
        >
          Total a cobrar
        </p>
        <p
          style={{
            color: "var(--cWhite)",
            marginTop: 8,
            fontSize: 36,
            fontWeight: 600,
            textAlign: "center",
            marginBottom: 16,
          }}
        >
          {formatBs(item?.amount)}
        </p>
        <div
          style={{
            border: "1px solid #494949",
            borderRadius: 12,
            padding: 16,
            display: "flex",
            gap: 16,
          }}
        >
          <LabelValue label="Deuda" value={formatBs(item?.amount)} />
          <LabelValue label="Multa" value={formatBs(item?.penalty_amount)} />
          <LabelValue
            label="Condonado"
            value={
              formatBs(item?.forgiveness_amount) +
              " (" +
              parseFloat(item?.forgiveness_percent) +
              "%)"
            }
          />
        </div>
        <div
          style={{
            border: "1px solid #494949",
            borderRadius: 12,
            padding: 16,
            display: "flex",
            gap: 16,
          }}
        >
          <LabelValue label="Unidad" value={item?.dpto?.nro} />
          <LabelValue
            label="Propietario"
            value={getFullName(item?.dpto?.homeowner)}
          />
          <LabelValue
            label="Titular"
            value={
              item?.dpto?.holder == "H"
                ? getFullName(item?.dpto?.homeowner)
                : getFullName(item?.dpto?.tenant)
            }
          />
        </div>
        <div
          style={{
            border: "1px solid #494949",
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div style={{ display: "flex", gap: 16 }}>
            <LabelValue
              label="Fecha de creación"
              value={getDateStrMesShort(item?.created_at)}
            />
            <LabelValue
              label="Estado"
              value={statusForgiveness[item?.status]}
            />
            <LabelValue
              label="Vencimiento"
              value={getDateStrMesShort(item?.due_at)}
            />
          </div>

          <LabelValue
            style={{ marginTop: 12 }}
            label="Creado por"
            value={getFullName(item?.confirmed_by)}
          />
        </div>
        <Table data={item?.forgiven_debts} header={header} />
      </div>
    </DataModal>
  );
};

export default RenderView;
