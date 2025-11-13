/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import styles from "./BankAccounts.module.css";
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
const renderTitleCell = ({ item }: Record<string, any>) => {
  return (
    <div>
      <p style={{ color: "var(--cWhite)" }}>{item.alias_holder}</p>
      <p>CI/NIT: {item.ci_holder}</p>
    </div>
  );
};

const BankAccounts = () => {
  const mod: ModCrudType = {
    modulo: "bank-accounts",
    singular: "cuenta bancaria",
    plural: "cuentas bancarias",
    filter: true,
    export: true,
    import: false,
    permiso: "owners",
    hideActions: {
      edit: true,
      del: true,
    },
    extraData: true,
    renderForm: (props: any) => <RenderForm {...props} />,
    loadView: { fullType: "DET" },
    renderView: (props: {
      open: boolean;
      onClose: any;
      item: Record<string, any>;
      onConfirm?: Function;
      extraData?: Record<string, any>;
      reLoad?: any;
    }) => <RenderView {...props} />,
  };
  // const getOptionsBankEntity = useCallback(
  //   (extraData: any) => [
  //     { id: "ALL", name: "Todos" },
  //     ...(extraData?.bankEntities || []),
  //   ],
  //   []
  // );
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
      alias_holder: {
        rules: ["required", "ci"],
        api: "ae",
        label: "Alias",
        form: {
          type: "text",
          required: true,
        },
        list: true,
      },

      assigned_to: {
        rules: ["required", "alpha"],
        api: "ae",
        label: "Asignado a",
        form: {
          type: "text",
          required: true,
        },
        list: {
          onRender: ({ item }: Record<string, any>) => {
            return (
              <p>
                {["Expensa", "Reserva", "Principal"]
                  .filter((label, index) => {
                    const flags = [
                      item?.is_expense,
                      item?.is_reserve,
                      item?.is_main,
                    ];
                    return flags[index] > 0;
                  })
                  .join(", ") || "-/-"}
              </p>
            );
          },
        },
      },
      status: {
        rules: [],
        api: "ae",
        form: false,
        list: {
          width: "180px",
          onRender: ({ item }: Record<string, any>) => {
            return (
              <div
                style={{
                  padding: "4px 8px",
                  backgroundColor:
                    item.status === "A"
                      ? "var(--cHoverSuccess)"
                      : "var(--cHoverError)",
                  color:
                    item.status === "A" ? "var(--cSuccess)" : "var(--cError)",
                  borderRadius: 12,
                  fontSize: 14,
                }}
              >
                {item.status === "A" ? "Habilitada" : "Deshabilitada"}
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
      bank_entity_id: {
        rules: ["required", "alpha"],
        api: "ae",
        label: "Entidad bancaria",
        form: {
          type: "select",
          required: true,
          optionsExtra: "bankEntities",
        },
        list: true,
        // filter: {
        //   label: "Entidades bancarias",
        //   width: "340px",
        //   // options: getOptionsBankEntity,
        // },
      },
      titular: {
        closeTag: true,
        rules: [""],
        api: "ae",
        label: "Titular",
        form: {
          type: "text",
        },
        list: {
          onRender: renderTitleCell,
        },
      },
      account_number: {
        rules: [""],
        api: "",
        label: "Nº de cuenta",
        list: {},
      },

      currency_type_id: {
        rules: ["required", "alpha"],
        api: "a",
        label: "Moneda",
        form: {
          type: "select",
          required: true,
          optionsExtra: "currencyTypes",
        },
        list: {
          width: "180px",
        },
      },
    };
  }, []);

  const { userCan, List, setStore, onSearch, searchs, onEdit, onDel, reLoad } =
    useCrud({
      paramsInitial,
      mod,
      fields,
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
        height={"calc(100vh - 465px)"}
        emptyMsg="Lista de cuentas bancarias vacía. Aquí verás a todas las cuentas bancarias"
        emptyLine2="del condominio una vez los registres."
        // emptyIcon={<IconHomePerson2 size={80} color="var(--cWhiteV1)" />}
      />
    </div>
  );
};
export default BankAccounts;
