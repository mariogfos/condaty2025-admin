/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import styles from "./BankAccounts.module.css";
import useCrudUtils from "../shared/useCrudUtils";
import React, { useCallback, useMemo } from "react";
import NotAccess from "@/components/layout/NotAccess/NotAccess";
import useCrud from "@/mk/hooks/useCrud/useCrud";
import RenderForm from "./RenderForm/RenderForm";
import RenderView from "./RenderView/RenderView";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { BankAccountStatus, BANK_ACCOUNT_STATUS_LABELS } from "./Type/BankType";
import { bankAccountsApi } from "./api";
import { getBankAccountsMod } from "./config/bankAccountsMod";

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

const BankAccounts = () => {
  // S41: mod extraído a factory `getBankAccountsMod()` (patrón S37.5 + S38.5)
  // para permitir tests unitarios sin renderizar React. Pineá
  // `mod.export: false` + `mod.exportAsync: { type: "bank-accounts", ... }`
  // para migrar al flow async PDF (S32 + S41 backend BankAccountsReportType).
  const mod = useMemo(() => getBankAccountsMod(), []);
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
      { id: BankAccountStatus.ACTIVE, name: "Habilitada" },
      { id: BankAccountStatus.INACTIVE, name: "Deshabilitada" },
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
            const isActive = Number(item.status) === BankAccountStatus.ACTIVE;
            return (
              <StatusBadge
                color={isActive ? "var(--cSuccess)" : "var(--cError)"}
                backgroundColor={
                  isActive
                    ? "var(--cHoverSuccess)"
                    : "var(--cHoverError)"
                }
              >
                {isActive ? "Habilitada" : "Deshabilitada"}
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
        height={"100%"}
        emptyMsg="Lista de cuentas bancarias vacía. Aquí verás a todas las cuentas bancarias"
        emptyLine2="del condominio una vez los registres."
      />
    </div>
  );
};
export default BankAccounts;
