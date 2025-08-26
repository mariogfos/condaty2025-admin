"use client";
import React, { useState, useMemo, useEffect, useCallback } from "react";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import styles from "./BudgetDir.module.css";
import { formatNumber } from "@/mk/utils/numbers";
import { getDateStrMes } from "@/mk/utils/date";
import { getFullName } from "@/mk/utils/string";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import BudgetApprovalView from "./RenderView/BudgetDirApprovalModal";

const paramsInitial = {
  perPage: 20,
  page: 1,
  fullType: "P",
  searchBy: "",
};

const formatPeriod = (periodCode: string): string => {
  const map: Record<string, string> = {
    M: "Mensual",
    Q: "Trimestral",
    B: "Semestral",
    Y: "Anual",
  };
  return map[periodCode] || periodCode;
};

const formatType = (typeCode: string): string => {
  const map: Record<string, string> = { F: "Fijo", V: "Variable" };
  return map[typeCode] || "Fijo";
};

// Usar la misma lógica de estados que Budget.tsx
interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
}

const renderStatusCell = (props: any) => {
  const statusConfig: Record<string, StatusConfig> = {
    D: {
      label: 'Borrador',
      color: 'var(--cInfo)',
      bgColor: 'var(--cHoverCompl3)',
    },
    P: {
      label: 'Pendiente por aprobar',
      color: 'var(--cWarning)',
      bgColor: 'var(--cHoverCompl4)',
    },
    A: {
      label: 'Aprobado',
      color: 'var(--cSuccess)',
      bgColor: 'var(--cHoverCompl2)',
    },
    R: {
      label: 'Rechazado',
      color: 'var(--cError)',
      bgColor: 'var(--cHoverError)',
    },
    C: {
      label: 'Completado',
      color: 'var(--cSuccess)',
      bgColor: 'var(--cHoverCompl2)',
    },
    X: {
      label: 'Cancelado',
      color: 'var(--cWhite)',
      bgColor: 'var(--cHoverCompl1)',
    },
  };

  const defaultConfig: StatusConfig = {
    label: 'No disponible',
    color: 'var(--cWhite)',
    bgColor: 'var(--cHoverCompl1)',
  };

  const { label, color, bgColor } =
    statusConfig[props.item.status as keyof typeof statusConfig] || defaultConfig;

  return (
    <StatusBadge color={color} backgroundColor={bgColor}>
      {label}
    </StatusBadge>
  );
};

const getPeriodOptions = (addDefault = false) => [
  ...(addDefault ? [{ id: "T", name: "Todos" }] : []),
  { id: "M", name: "Mensual" },
  { id: "B", name: "Semestral" },
  { id: "Q", name: "Trimestral" },
  { id: "Y", name: "Anual" },
];

const getTypeOptions = (addDefault = false) => [
  ...(addDefault ? [{ id: "T", name: "Todos" }] : []),
  { id: "F", name: "Fijo" },
  { id: "V", name: "Variable" },
];

const getStatusOptions = (addDefault = false) => [
  ...(addDefault ? [{ id: "T", name: "Todos" }] : []),
  { id: "D", name: "Borrador" },
  { id: "P", name: "Pendiente por aprobar" },
  { id: "A", name: "Aprobado" },
  { id: "R", name: "Rechazado" },
  { id: "C", name: "Completado" },
  { id: "X", name: "Cancelado" },
];

const getCategoryOptionsForFilter = (extraData: any) => [
  { id: "T", name: "Todos" },
  ...(extraData?.categories || []).map((cat: any) => ({
    id: cat.id,
    name: cat.name,
  })),
];

const mod: ModCrudType = {
  modulo: "budgets",
  singular: "Presupuesto",
  plural: "Presupuestos",
  permiso: "",
  extraData: true,
  hideActions: {
    add: true,
    edit: true,
    del: true,
  },
  filter: true,
  saveMsg: {
    add: "Presupuesto creado con éxito",
    edit: "Presupuesto actualizado con éxito",
    del: "Presupuesto eliminado con éxito",
  },
  renderView: (props: any) => <BudgetApprovalView {...props} />,
};

const BudgetDir = () => {
  const handleGetFilter = useCallback(
    (opt: string, value: string, oldFilterState: any) => {
      const currentFilters = { ...(oldFilterState?.filterBy || {}) };
      if (value === "" || value === null || value === undefined) {
        delete currentFilters[opt];
      } else {
        currentFilters[opt] = value;
      }
      return { filterBy: currentFilters };
    },
    []
  );

  const fields = useMemo(
    () => ({
      id: { rules: [], api: "e" },
      name: {
        rules: ["required"],
        api: "ae",
        label: "Nombre",
        form: { type: "text" },
        list: { order: 1 }, // Primera columna
      },
      start_date: {
        rules: ["required"],
        api: "ae",
        label: "Fecha Inicio",
        form: { type: "date" },
        list: false, // Ocultar
      },
      end_date: {
        rules: ["required"],
        api: "ae",
        label: "Fecha Fin",
        form: { type: "date" },
        list: false, // Ocultar
      },
      amount: {
        rules: ["required", "number"],
        api: "ae",
        label: "Monto",
        form: { type: "number", placeholder: "Ej: 5000.00" },
        list: false, // Ocultar
      },
      period: {
        rules: ["required"],
        api: "ae",
        label: "Periodo",
        form: { type: "select", options: getPeriodOptions() },
        list: false, // Ocultar
        /* filter: {
          label: "Periodo",
          options: () => getPeriodOptions(true),
          width: "150px",
        }, */
      },
      status: {
        rules: [],
        api: "ae*",
        label: "Estado",
        list: {
          onRender: renderStatusCell, // Usar la nueva lógica de estados
          order: 4 // Cuarta columna
        },
        filter: {
          label: "Estado",
          options: () => getStatusOptions(true),
          width: "150px",
        },
      },
      category_id: {
        rules: ["required"],
        api: "ae",
        label: "Categoría",
        form: {
          type: "select",
          optionsExtra: "categories",
          placeholder: "Seleccione categoría",
        },
        list: {
          onRender: (props: any) => props.item.category?.name || "N/A",
          order: 2 // Segunda columna
        },
        /* filter: {
          label: "Categoría",
          options: getCategoryOptionsForFilter,
          width: "200px",
        }, */
      },
      user_id: {
        api: "e",
        label: "Creado por",
        list: {
          onRender: (props: any) => getFullName(props.item.user) || "Sistema",
          order: 3 // Tercera columna
        },
      },
      approved: {
        api: "e",
        label: "Aprobado por",
        list: false, // Ocultar
      },
    }),
    []
  );

  const { List, extraData, data, loaded, showToast, userCan } = useCrud({
    paramsInitial,
    mod,
    fields,
    getFilter: handleGetFilter,
  });

  useEffect(() => {
    if (loaded && data) {
      if (
        data.success === true &&
        data.data &&
        !Array.isArray(data.data) &&
        typeof data.data.msg === "string"
      ) {
        showToast(data.data.msg, "error");
      }
    }
  }, [data, loaded, showToast]);

  return (
    <div className={styles.container}>
      <List height={'calc(100vh - 360px)'} />
    </div>
  );
};

export default BudgetDir;
