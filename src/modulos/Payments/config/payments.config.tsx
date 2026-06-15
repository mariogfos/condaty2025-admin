import React from "react";
import { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import RenderForm from "../RenderForm/RenderForm";
import RenderView from "../RenderView/RenderView";
import RenderDel from "../RenderDel/RenderDel";
import { getDateStrMes, MONTHS } from "@/mk/utils/date";
import FormatBsAlign from "@/mk/utils/FormatBsAlign";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import {
  PERIOD_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  STATUS_OPTIONS,
  METHOD_MAP,
  getPaymentStatusConfig,
} from "../Type/PaymentType";

const renderDptosCell = (props: any) => (
  <div>{String(props.item.dptos).replace(/,/g, "")}</div>
);

const renderPaidAtCell = (props: any) => (
  <div>{getDateStrMes(props.item.paid_at, false, true) || "No pagado"}</div>
);

const renderMethodCell = (props: any) => (
  <div>{METHOD_MAP[props.item.method] || props.item.method}</div>
);

const renderStatusCell = (props: any) => {
  const status = props.item.status;
  const info = getPaymentStatusConfig(Number(status));
  return (
    <StatusBadge color={info.color} backgroundColor={info.backgroundColor}>
      {info.label}
    </StatusBadge>
  );
};

const renderAmountCell = (props: any) => (
  <FormatBsAlign value={props.item.amount} alignRight />
);

const renderConceptCell = (props: any, textOverflowClass: string) => {
  const item = props.item ?? {};
  const details = Array.isArray(item.details) ? (item.details as any[]) : [];

  const truncate = (s: string, max = 30) =>
    s.length > max ? s.slice(0, max) + "…" : s;

  const linesFromDetails: string[] = details.map((d: any) => {
    const base = d?.subcategory?.padre?.name || d?.subcategory?.name || "-/-";
    const debtObj = d?.debt_dpto?.debt;
    const resArea = d?.debt_dpto?.reservation?.area;

    if (debtObj) {
      const period =
        debtObj?.period ?? debtObj?.periodo ?? debtObj?.month ?? debtObj?.mes;
      const year = debtObj?.year ?? debtObj?.anio ?? debtObj?.y ?? debtObj?.yr;
      const toMonthName = (m: any) => {
        const num = Number(m);
        if (!Number.isNaN(num) && num >= 1 && num <= 12)
          return MONTHS[num] || undefined;
        const s = String(m);
        const match = s.match(/^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/);
        if (match) {
          const mm = Number(match[1] ? match[2] : match[2]);
          if (mm >= 1 && mm <= 12) return MONTHS[mm] || undefined;
        }
        return undefined;
      };
      const periodName =
        period !== undefined && period !== null
          ? (toMonthName(period) ?? String(period))
          : undefined;
      const parts = [periodName, year]
        .filter((v) => v !== undefined && v !== null)
        .map(String);
      const extra = parts.length ? parts.join(" ") : "";
      return extra ? `${base} · ${extra}` : base;
    }

    if (resArea) {
      const areaText = resArea?.title ?? resArea?.name ?? resArea?.id;
      const txt = areaText ? truncate(String(areaText)) : "";
      return txt ? `${base} · ${txt}` : base;
    }

    const subName = d?.subcategory?.name
      ? truncate(String(d?.subcategory?.name))
      : "";
    return subName ? `${base} · ${subName}` : base;
  });

  if (linesFromDetails.length > 0) {
    const text = linesFromDetails.join(" | ");
    return (
      <div className={textOverflowClass}>
        {text}
      </div>
    );
  }

  const concepts: string[] = Array.isArray(item.concept)
    ? (item.concept as string[])
    : [];
  if (concepts.length > 0) {
    const text = concepts.join(" | ");
    return (
      <div className={textOverflowClass}>
        {text}
      </div>
    );
  }

  if (item.concepto) {
    const text = String(item.concepto);
    return (
      <div className={textOverflowClass}>
        {text}
      </div>
    );
  }

  return <div>-/-</div>;
};

export const getPaymentsConfig = (
  textOverflowClass: string,
  alignRightClass: string,
  centerClass: string
): { mod: ModCrudType; fields: any } => {
  const mod: ModCrudType = {
    modulo: "payments",
    singular: "Ingreso",
    plural: "Ingresos",
    permiso: "payments",
    extraData: true,
    renderForm: RenderForm,
    renderView: (props: any) => <RenderView {...props} />,
    renderDel: (props: any) => <RenderDel {...props} />,
    reportPreset: "payments-income",
    hideActions: {
      view: false,
      add: false,
      edit: true,
      del: true,
    },
    filter: true,
    export: true,
    titleAdd: "Nuevo",
    titleDel: "Anular",
    saveMsg: {
      add: "Ingreso creado con éxito",
      edit: "Ingreso actualizado con éxito",
      del: "Ingreso anulado con éxito",
    },
  };

  const fields = {
    id: { rules: [], api: "e" },
    paid_at: {
      rules: [],
      api: "ae",
      label: "Fecha de cobro",
      form: {
        type: "date",
      },
      list: {
        width: 260,
        onRender: renderPaidAtCell,
      },
      filter: {
        key: "paid_at",
        label: "Periodo",
        options: () => PERIOD_OPTIONS,
      },
    },
    dptos: {
      api: "ae",
      label: "Unidad",
      list: {
        width: 140,
        onRender: renderDptosCell,
      },
    },
    method: {
      rules: ["required"],
      api: "ae",
      label: "Método de pago",
      form: {
        type: "select",
        options: [
          { id: "T", name: "Transferencia" },
          { id: "E", name: "Efectivo" },
          { id: "C", name: "Cheque" },
        ],
      },
      list: {
        width: 200,
        onRender: renderMethodCell,
      },
      filter: {
        label: "Método de pago",
        options: () => PAYMENT_METHOD_OPTIONS,
      },
    },
    concepto: {
      rules: ["required"],
      api: "ae",
      label: "Concepto",
      form: {
        type: "text",
        placeholder: "Ej: Pago de servicios",
      },
      list: {
        width: 300,
        onRender: (props: any) => renderConceptCell(props, textOverflowClass),
      },
    },
    status: {
      rules: [],
      api: "ae",
      label: (
        <span className={centerClass}>
          Estado
        </span>
      ),
      list: {
        width: 160,
        onRender: renderStatusCell,
      },
      filter: {
        label: "Estado",
        options: () => STATUS_OPTIONS,
      },
    },
    amount: {
      rules: ["required", "number"],
      api: "ae",
      label: (
        <span className={alignRightClass}>
          Monto total
        </span>
      ),
      form: {
        type: "number",
        placeholder: "Ej: 100.00",
      },
      list: {
        onRender: renderAmountCell,
      },
    },
  };

  return { mod, fields };
};
