/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import styles from "./PartialPayments.module.css";
import useCrudUtils from "../shared/useCrudUtils";
import React, { useCallback, useMemo, useState } from "react";
import NotAccess from "@/components/layout/NotAccess/NotAccess";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import RenderForm from "./RenderForm/RenderForm";
import RenderView from "./RenderView/RenderView";
import { formatBs } from "../../mk/utils/numbers";
import { MONTHS } from "../../mk/utils/date";
import DateRangeFilterModal from "@/components/DateRangeFilterModal/DateRangeFilterModal";

const paramsInitial = {
  perPage: 20,
  page: 1,
  fullType: "L",
  searchBy: "",
};
const statusPartialPayment: any = {
  I: "Pago parcial",
  P: "Cobrado",
  X: "Anulado",
};
const statusColorPartialPayment: any = {
  I: { color: "var(--cMediumAlert)", bg: "var(--cHoverCompl5)" },
  P: { color: "var(--cSuccess)", bg: "var(--cHoverSuccess)" },
  X: { color: "var(--cError)", bg: "var(--cHoverError)" },
};
const periodOptions = [
  { id: "ALL", name: "Todos" },
  { id: "d", name: "Hoy" },
  { id: "ld", name: "Ayer" },
  { id: "w", name: "Esta semana" },
  { id: "lw", name: "Semana anterior" },
  { id: "m", name: "Este mes" },
  { id: "lm", name: "Mes anterior" },
  { id: "y", name: "Este año" },
  { id: "ly", name: "Año anterior" },
  { id: "custom", name: "Personalizado" },
];
const PartialPayments = () => {
  const [openCustomFilterModal, setOpenCustomFilterModal] = useState(false);
  const [customDateErrors, setCustomDateErrors] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  const handleGetFilter = (opt: string, value: string, oldFilterState: any) => {
    const currentFilters = { ...(oldFilterState?.filterBy || {}) };

    if (opt === "in_at" && value === "custom") {
      setCustomDateErrors({});
      setOpenCustomFilterModal(true);
      delete currentFilters[opt];
      return { filterBy: currentFilters };
    }

    if (value === "" || value === null || value === undefined) {
      delete currentFilters[opt];
    } else {
      currentFilters[opt] = value;
    }
    return { filterBy: currentFilters };
  };

  const onSaveFilterModal = ({ startDate, endDate }: any) => {
    let err: { startDate?: string; endDate?: string } = {};
    if (!startDate) err.startDate = "La fecha de inicio es obligatoria";
    if (!endDate) err.endDate = "La fecha de fin es obligatoria";
    if (startDate && endDate && startDate > endDate)
      err.startDate = "La fecha de inicio no puede ser mayor a la de fin";
    if (startDate && endDate && startDate.slice(0, 4) !== endDate.slice(0, 4)) {
      err.startDate =
        "El periodo personalizado debe estar dentro del mismo año";
      err.endDate = "El periodo personalizado debe estar dentro del mismo año";
    }
    if (Object.keys(err).length > 0) {
      setCustomDateErrors(err);
      return;
    }
    const customDateFilterString = `${startDate},${endDate}`;
    onFilter("in_at", customDateFilterString);
    setOpenCustomFilterModal(false);
    setCustomDateErrors({});
  };
  const mod: ModCrudType = {
    modulo: "partialpayments",
    singular: "pago parcial",
    plural: "pagos parciales",
    filter: true,
    export: true,
    import: false,
    permiso: "owners",
    hideActions: {
      edit: true,
      del: true,
    },
    extraData: true,

    titleAdd: "Nuevo",
    renderForm: (props: any) => <RenderForm {...props} />,
    renderView: (props: {
      open: boolean;
      onClose: any;
      item: Record<string, any>;
      onConfirm?: Function;
      extraData?: Record<string, any>;
      reLoad?: any;
    }) => <RenderView {...props} />,
  };
  const getOptionsBankEntity = useCallback(
    (extraData: any) => [
      { id: "ALL", name: "Todos" },
      ...(extraData?.bankEntities || []),
    ],
    []
  );
  const getOptionsStatus = useCallback(
    () => [
      { id: "ALL", name: "Todos" },
      { id: "P", name: "Cobrado" },
      { id: "I", name: "Pago parcial" },
      { id: "X", name: "Anulado" },
    ],
    []
  );
  const fields = useMemo(() => {
    return {
      id: { rules: [], api: "e" },
      dpto_id: {
        rules: ["required", "ci"],
        api: "ae",
        label: "Unidad",
        form: {
          type: "text",
          required: true,
        },
        list: {
          onRender: ({ item }: Record<string, any>) => {
            return <p>{item?.dpto?.nro}</p>;
          },
        },
      },

      concept: {
        rules: ["required", "alpha"],
        api: "ae",
        label: "Concepto",
        form: {
          type: "text",
          required: true,
        },
        list: {
          onRender: ({ item }: Record<string, any>) => {
            return (
              <p>
                {item?.subcategory?.name} - {MONTHS[item?.debt?.month]}{" "}
                {item?.debt?.year}
              </p>
            );
          },
        },
      },
      status: {
        rules: [],
        api: "ae",
        label: "Estado",
        form: false,
        list: {
          width: "180px",
          onRender: ({ item }: Record<string, any>) => {
            return (
              <div
                style={{
                  padding: "6px 8px",
                  backgroundColor:
                    statusColorPartialPayment[item?.status || ""]?.bg,
                  color: statusColorPartialPayment[item?.status || ""]?.color,
                  borderRadius: 20,
                  fontSize: 14,
                }}
              >
                {statusPartialPayment[item?.status || ""]}
              </div>
            );
          },
        },
        filter: {
          label: "Estados",
          width: "180px",
          options: getOptionsStatus,
        },
      },
      initial_debt: {
        rules: ["required", "alpha"],
        api: "ae",
        label: "Deuda inicial",
        form: {
          type: "number",
          required: true,
        },
        list: {
          onRender: ({ item }: Record<string, any>) => {
            return <p>{formatBs(item?.amount)}</p>;
          },
        },
        // filter: {
        //   label: "Deuda inicial",
        //   width: "340px",
        //   options: getOptionsBankEntity,
        // },
      },
      paid_amount: {
        closeTag: true,
        rules: [""],
        api: "ae",
        label: "Monto pagado",
        form: {
          type: "number",
          required: true,
        },
        list: {
          onRender: ({ item }: Record<string, any>) => {
            return <p>{formatBs(item?.paid_amount)}</p>;
          },
        },
      },
      penalty_amount: {
        rules: [""],
        api: "",
        label: "Multa",
        form: {
          type: "number",
          required: true,
        },
        list: {
          onRender: ({ item }: Record<string, any>) => {
            return <p>{formatBs(item?.penalty_amount)}</p>;
          },
        },
      },

      remaining_amount: {
        rules: ["required", "alpha"],
        api: "a",
        label: "Pendiente de pago",
        form: {
          type: "number",
          required: true,
        },
        list: {
          onRender: ({ item }: Record<string, any>) => {
            return <p>{formatBs(item?.remaining_amount)}</p>;
          },
        },
      },
      updated_at: {
        rules: [],
        api: "a",
        label: "Actualizado",
        form: false,
        list: false,
        filter: {
          label: "Periodo",
          width: "180px",
          options: () => periodOptions,
        },
      },
    };
  }, []);

  const {
    userCan,
    List,
    setStore,
    onSearch,
    searchs,
    onEdit,
    onDel,
    onFilter,
  } = useCrud({
    paramsInitial,
    mod,
    fields,
    getFilter: handleGetFilter,
  });
  const { onLongPress, selItem } = useCrudUtils({
    onSearch,
    searchs,
    setStore,
    mod,
    onEdit,
    onDel,
  });

  if (!userCan(mod.permiso, "R")) return <NotAccess />;
  return (
    <div className={styles.style}>
      <List
        height={"calc(100vh - 345px)"}
        emptyMsg="Lista de pagos parciales vacía. Aquí verás a todos los pagos parciales"
        emptyLine2="del condominio una vez los registres."
      />
      <DateRangeFilterModal
        open={openCustomFilterModal}
        onClose={() => {
          setOpenCustomFilterModal(false);
          setCustomDateErrors({});
        }}
        onSave={onSaveFilterModal}
        errorStart={customDateErrors.startDate}
        errorEnd={customDateErrors.endDate}
      />
    </div>
  );
};
export default PartialPayments;
