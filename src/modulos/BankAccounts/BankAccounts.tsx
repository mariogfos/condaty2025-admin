/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import styles from "./BankAccounts.module.css";
import useCrudUtils from "../shared/useCrudUtils";
import React, { useCallback, useMemo } from "react";
import NotAccess from "@/components/layout/NotAccess/NotAccess";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import RenderForm from "./RenderForm/RenderForm";
import RenderView from "./RenderView/RenderView";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { useAuth } from "@/mk/contexts/AuthProvider";
import {
  QR_ACCOUNT_STATE_COLOR,
  QR_ACCOUNT_STATE_LABEL,
  qrAccountState,
} from "@/modulos/QrDinamico/shared";

const paramsInitial = {
  perPage: 20,
  page: 1,
  fullType: "L",
  searchBy: "",
};
const renderTitleCell = ({ item }: Record<string, any>) => {
  return (
    <div>
      <p style={{ color: "var(--cWhite)" }}>{item.holder}</p>
      <p>CI/NIT: {item.ci_holder}</p>
    </div>
  );
};
const centeredColumnStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
} as const;

const renderQrStateCell = ({ item }: Record<string, any>) => {
  const state = qrAccountState(item);
  const tone = QR_ACCOUNT_STATE_COLOR[state];
  return (
    <StatusBadge color={tone.color} backgroundColor={tone.bg}>
      {QR_ACCOUNT_STATE_LABEL[state]}
    </StatusBadge>
  );
};

const BankAccounts = () => {
  const { user } = useAuth();
  // RN-ADM-01: dynamic QR is a FOS-only concern, a condo admin never sees it.
  const isFos = Boolean(user?.fosrole_id);
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
        label: "Estado",
        form: false,
        list: {
          width: "180px",
          className: styles.statusColumn,
          style: centeredColumnStyle,
          onRender: ({ item }: Record<string, any>) => {
            return (
              <StatusBadge
                color={item.status === "A" ? "var(--cSuccess)" : "var(--cError)"}
                backgroundColor={
                  item.status === "A"
                    ? "var(--cHoverSuccess)"
                    : "var(--cHoverError)"
                }
              >
                {item.status === "A" ? "Habilitada" : "Deshabilitada"}
              </StatusBadge>
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
        filter: {
          label: "Entidades bancarias",
          width: "340px",
          options: getOptionsBankEntity,
        },
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
      // QR-07: without this column there is no way to tell which account has
      // dynamic QR on without opening every modal one by one.
      ...(isFos
        ? {
            qr_dynamic_enabled: {
              rules: [],
              api: "",
              label: "QR Dinámico",
              form: false,
              list: {
                width: "180px",
                className: styles.statusColumn,
                style: centeredColumnStyle,
                onRender: renderQrStateCell,
              },
            },
          }
        : {}),
    };
  }, [isFos]);

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
        height={"100%"}
        emptyMsg="Lista de cuentas bancarias vacía. Aquí verás a todas las cuentas bancarias"
        emptyLine2="del condominio una vez los registres."
      />
    </div>
  );
};
export default BankAccounts;
