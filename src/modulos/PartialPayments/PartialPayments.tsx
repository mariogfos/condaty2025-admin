/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import styles from "./PartialPayments.module.css";
import useCrudUtils from "../shared/useCrudUtils";
import React, { useCallback, useMemo } from "react";
import NotAccess from "@/components/layout/NotAccess/NotAccess";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import RenderForm from "./RenderForm/RenderForm";
import RenderView from "./RenderView/RenderView";

const paramsInitial = {
  perPage: 20,
  page: 1,
  fullType: "L",
  searchBy: "",
};
const PartialPayments = () => {
  const mod: ModCrudType = {
    modulo: "bank-accounts",
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
      { id: "A", name: "Habilitada" },
      { id: "X", name: "Deshabilitada" },
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
            return <p>A - 21</p>;
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
            return <p>Pago Expensas - Enero 2025</p>;
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
                  padding: "4px 8px",
                  backgroundColor: "var(--cHoverCompl5)",
                  color: "var(--cMediumAlert)",
                  borderRadius: 12,
                  fontSize: 14,
                }}
              >
                Por pagar
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
            return <p>Bs 2,000.00</p>;
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
            return <p>Bs 300.00</p>;
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
            return <p>Bs 0.00</p>;
          },
        },
      },

      pending_payment: {
        rules: ["required", "alpha"],
        api: "a",
        label: "Pendiente de pago",
        form: {
          type: "number",
          required: true,
        },
        list: {
          onRender: ({ item }: Record<string, any>) => {
            return <p>Bs 1,700.00</p>;
          },
        },
      },
    };
  }, []);

  const { userCan, List, setStore, onSearch, searchs, onEdit, onDel } = useCrud(
    {
      paramsInitial,
      mod,
      fields,
    }
  );
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
        emptyMsg="Lista de cuentas bancarias vacía. Aquí verás a todas las cuentas bancarias"
        emptyLine2="del condominio una vez los registres."
      />
    </div>
  );
};
export default PartialPayments;
