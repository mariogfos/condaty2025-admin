"use client";
import React, { useState, useMemo, useEffect, useCallback } from "react";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import styles from "./BudgetDir.module.css";
import { formatNumber } from "@/mk/utils/numbers";
import { getDateStrMes } from "@/mk/utils/date";
import { getFullName } from "@/mk/utils/string";
import { useAuth } from "@/mk/contexts/AuthProvider"; // Probablemente no necesites importar useAuth aquí directamente
import BudgetApprovalView from "./RenderView/BudgetDirApprovalModal";

// ... (paramsInitial, formatters, options, mod - sin cambios) ...
const paramsInitial = {
  perPage: 20,
  page: 1,
  fullType: "P",
  searchBy: "",
};

const formatPeriod = (periodCode: string): string => {
    const map: Record<string, string> = { M: "Mensual", Q: "Trimestral", B: "Semestral", Y: "Anual" }; // M: monthly | Q: quaterly | B: biannual | Y: yearly
    return map[periodCode] || periodCode;
};
const formatType = (typeCode: string): string => {
    const map: Record<string, string> = { F: "Fijo", V: "Variable" };
    return map[typeCode] || "Fijo";
};
const formatStatus = (statusCode: string): string => {
    const map: Record<string, string> = { D: "Borrador", P: "Pendiente Aprobación", A: "Aprobado", R: "Rechazado", C: "Completado", X: "Cancelado" };
    return map[statusCode] || statusCode;
};
const getPeriodOptions = (addDefault = false) => [
    ...(addDefault ? [{ id: "T", name: "Todos" }] : []),
    { id: "M", name: "Mensual" }, { id: "B", name: "Semestral" }, { id: "Q", name: "Trimestral" }, { id: "Y", name: "Anual" }
];
const getTypeOptions = (addDefault = false) => [
    ...(addDefault ? [{ id: "T", name: "Todos" }] : []),
    { id: "F", name: "Fijo" }, { id: "V", name: "Variable" }
];
const getStatusOptions = (addDefault = false) => [
    ...(addDefault ? [{ id: "T", name: "Todos" }] : []),
    { id: "D", name: "Borrador" }, { id: "P", name: "Pendiente Aprobación" }, { id: "A", name: "Aprobado" }, { id: "R", name: "Rechazado" }, { id: "C", name: "Completado" }, { id: "X", name: "Cancelado" }
];
const getCategoryOptionsForFilter = (extraData: any) => [
    { id: "T", name: "Todos" },
    ...(extraData?.categories || []).map((cat: any) => ({ id: cat.id, name: cat.name }))
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
    saveMsg: { add: "Presupuesto creado con éxito", edit: "Presupuesto actualizado con éxito", del: "Presupuesto eliminado con éxito" },
    renderView: (props: any) => <BudgetApprovalView {...props} />,
};


const BudgetDir = () => {
  // No necesitas useAuth aquí si useCrud ya te da showToast y userCan
  // const { setStore, userCan } = useAuth();

  const handleGetFilter = useCallback((opt: string, value: string, oldFilterState: any) => {
    const currentFilters = { ...(oldFilterState?.filterBy || {}) };
    if (value === "" || value === null || value === undefined) {
        delete currentFilters[opt];
    } else {
        currentFilters[opt] = value;
    }
    return { filterBy: currentFilters };
  }, []);

  const fields = useMemo(
    () => ({
        // ... tu definición de fields completa (incluyendo status y approved_id corregidos) ...
        id: { rules: [], api: "e" },
        name: { rules: ["required"], api: "ae", label: "Nombre", form: { type: "text" }, list: {}, },
        start_date: { rules: ["required"], api: "ae", label: "Fecha Inicio", form: { type: "date" }, list: { onRender: (props: any) => getDateStrMes(props.item.start_date) }, },
        end_date: { rules: ["required"], api: "ae", label: "Fecha Fin", form: { type: "date" }, list: { onRender: (props: any) => getDateStrMes(props.item.end_date) }, },
        amount: { rules: ["required", "number"], api: "ae", label: "Monto", form: { type: "number", placeholder: "Ej: 5000.00" }, list: { onRender: (props: any) => `Bs ${formatNumber(props.item.amount)}` }, },
        period: { rules: ["required"], api: "ae", label: "Periodo", form: { type: "select", options: getPeriodOptions() }, list: { onRender: (props: any) => formatPeriod(props.item.period) }, filter: { label: "Periodo", options: () => getPeriodOptions(true), width: "150px" }, },
        status: { rules: [], api: "", label: "Estado", list: { onRender: (props: any) => { const statusText = formatStatus(props.item.status); return (<div className={`${styles.statusBadge} ${styles[`status${props.item.status}`] || ''}`}>{statusText}</div>); }, }, filter: { label: "Estado", options: () => getStatusOptions(true), width: "150px"}, },
        category_id: { rules: ["required"], api: "ae", label: "Categoría", form: { type: "select", optionsExtra: "categories", placeholder: "Seleccione categoría" }, list: { onRender: (props: any) => props.item.category?.name || "N/A" }, filter: { label:"Categoría", options: getCategoryOptionsForFilter, width: "200px" } },
        user_id: { api: "e", label: "Creado por", list: { onRender: (props: any) => getFullName(props.item.user) || 'Sistema' } },
        approved: { api: "e", label: "Aprobado por", list: { onRender: (props: any) => getFullName(props.item.approved) || 'Pendiente' } },
    }),
    []
  );

  // --- Desestructura 'data', 'loaded' y 'showToast' de useCrud ---
  const { List, extraData, data, loaded, showToast, userCan } =
    useCrud({
      paramsInitial,
      mod,
      fields,
      getFilter: handleGetFilter,
    });

  // --- useEffect para detectar el mensaje específico en la respuesta ---
  useEffect(() => {
    // Solo actuar si la carga terminó (loaded es true) y hay datos (data existe)
    if (loaded && data) {
      // Condición: La API dice success: true, PERO data.data NO es un array
      // Y ADEMÁS, data.data es un objeto que contiene una propiedad 'msg' de tipo string.
      if (data.success === true && data.data && !Array.isArray(data.data) && typeof data.data.msg === 'string') {
        // Muestra el mensaje de la API como un toast de error
        showToast(data.data.msg, 'error');
      }
    }
    // Dependencias: Ejecutar este efecto si 'data', 'loaded' o 'showToast' cambian.
  }, [data, loaded, showToast]);


  // Este chequeo puede ser redundante si la API ya controla el acceso
  // y devuelve el mensaje que estamos capturando en el useEffect.
  // Puedes comentarlo o quitarlo si prefieres confiar en la respuesta de la API.
  // if (!userCan(mod.permiso, "R")) return <NotAccess />;

  return (
    <div className={styles.container}>
      {/* El componente List internamente mostrará "No existen datos"
          si data.data no es un array (como en el caso del mensaje de error).
          El toast que añadimos explicará por qué. */}
      <List />
    </div>
  );
};

export default BudgetDir;