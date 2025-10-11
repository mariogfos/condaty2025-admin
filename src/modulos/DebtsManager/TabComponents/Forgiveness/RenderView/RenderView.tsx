import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Table from "@/mk/components/ui/Table/Table";
import { getDateStrMesShort } from "@/mk/utils/date";
import { formatBs } from "@/mk/utils/numbers";
import { getFullName } from "@/mk/utils/string";
import React from "react";
import { colorStatusForgiveness, statusForgiveness } from "../constans";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import Button from "@/mk/components/forms/Button/Button";

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
        <p style={{ color: "var(--cWhite)", marginTop: 8, ...styleValue }}>
          {value}
        </p>
      ) : (
        value
      )}
    </div>
  );
};

const RenderView = ({ open, onClose, item, onDel, onEdit }: any) => {
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
        return formatBs(item?.amount);
      },
    },
  ];

  const getStatus = (item: any) => {
    let status = item?.status;
    if (
      item?.due_at < new Date().toISOString().split("T")[0] &&
      item?.status == "A"
    ) {
      status = "M";
    }
    return status;
  };
  return (
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
          {item?.due_at < new Date().toISOString().split("T")[0] ||
          item?.status == "P" ||
          item?.status == "S" ||
          item?.status == "X" ? null : (
            <Button
              onClick={() => onEdit(item)}
              variant="secondary"
              style={{ flex: 1 }}
            >
              Editar
            </Button>
          )}
          {item?.status == "P" ||
          item?.status == "S" ||
          item?.status == "X" ? null : (
            <Button
              onClick={() => onDel(item)}
              variant="secondary"
              style={{ flex: 1 }}
            >
              Anular
            </Button>
          )}
        </div>
      }
    >
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
          <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
            <LabelValue
              label="Estado"
              value={
                <StatusBadge
                  containerStyle={{
                    justifyContent: "flex-start",
                  }}
                  color={colorStatusForgiveness[getStatus(item)]?.color}
                  backgroundColor={colorStatusForgiveness[getStatus(item)]?.bg}
                >
                  {statusForgiveness[getStatus(item)]}
                </StatusBadge>
              }
            />
            <LabelValue
              label="Vencimiento:"
              value={getDateStrMesShort(item?.due_at)}
            />
            <LabelValue
              label="Fecha de creación:"
              value={getDateStrMesShort(item?.created_at)}
            />
          </div>

          <LabelValue
            style={{ marginTop: 12 }}
            label="Creado por:"
            value={getFullName(item?.confirmed_by)}
          />
        </div>
        <Table
          data={item?.forgiven_debts}
          header={header}
          // onRowClick={(e) => console.log("Hola")}
        />
        {item?.obs && (
          <>
            <p
              style={{
                color: "var(--cWhite)",
                fontSize: 16,
                fontWeight: "500",
              }}
            >
              Detalles
            </p>
            <div
              style={{
                backgroundColor: "#353839",
                padding: "12px 16px",
                borderRadius: 8,
              }}
            >
              <p
                style={{
                  color: "var(--cWhite)",
                  fontSize: 14,
                  fontWeight: "400",
                  whiteSpace: "pre-wrap",
                }}
              >
                {item?.obs}
              </p>
            </div>
          </>
        )}
      </div>
    </DataModal>
  );
};

export default RenderView;
