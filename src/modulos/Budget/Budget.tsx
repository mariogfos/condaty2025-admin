"use client";
import React, { useState, useMemo, useEffect, useCallback } from "react";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import styles from "./Budget.module.css";
import { formatNumber } from "@/mk/utils/numbers";
import { getDateStrMes } from "@/mk/utils/date";
import { getFullName } from "@/mk/utils/string";
import { useAuth } from "@/mk/contexts/AuthProvider";
// import RenderForm from "./RenderForm/RenderForm";

const paramsInitial = {
  perPage: 20,
  page: 1,
  fullType: "L",
  searchBy: "",
};

const formatPeriod = (periodCode: string): string => {
    const map: Record<string, string> = { D: "Diario", W: "Semanal", F: "Quincenal", M: "Mensual", B: "Bimestral", Q: "Trimestral", S: "Semestral", Y: "Anual" };
    return map[periodCode] || periodCode;
};
const formatType = (typeCode: string): string => {
    const map: Record<string, string> = { F: "Fijo", V: "Variable" };
    // Asume Fijo si no es 'V' o viene nulo/vacío
    return map[typeCode] || "Fijo";
};
const formatStatus = (statusCode: string): string => {
    const map: Record<string, string> = { D: "Borrador", A: "Aprobado", R: "Rechazado", C: "Completado", X: "Cancelado" };
    return map[statusCode] || statusCode;
};
const getPeriodOptions = (addDefault = false) => [
    ...(addDefault ? [{ id: "", name: "Todos" }] : []),
    { id: "M", name: "Mensual" }, { id: "B", name: "Bimestral" }, { id: "Q", name: "Trimestral" }, { id: "S", name: "Semestral" }, { id: "Y", name: "Anual" }
];
const getTypeOptions = (addDefault = false) => [
    ...(addDefault ? [{ id: "", name: "Todos" }] : []),
    { id: "F", name: "Fijo" }, { id: "V", name: "Variable" }
];
const getStatusOptions = (addDefault = false) => [
    ...(addDefault ? [{ id: "", name: "Todos" }] : []),
    { id: "D", name: "Borrador" }, { id: "A", name: "Aprobado" }, { id: "R", name: "Rechazado" }, { id: "C", name: "Completado" }, { id: "X", name: "Cancelado" }
];
const getCategoryOptionsForFilter = (extraData: any) => [
    { id: "", name: "Todos" },
    ...(extraData?.categories || []).map((cat: any) => ({ id: cat.id, name: cat.name }))
];

const mod: ModCrudType = {
    modulo: "budgets",
    singular: "Presupuesto",
    plural: "Presupuestos",
    permiso: "", 
    extraData: true,
    hideActions: {},
    filter: true,
    saveMsg: { add: "Presupuesto creado con éxito", edit: "Presupuesto actualizado con éxito", del: "Presupuesto eliminado con éxito" },
};



const Budget = () => {
  const { setStore, userCan } = useAuth();
  const handleGetFilter = useCallback((opt: string, value: string, oldFilterState: any) => {
    // 1. Obtiene el objeto interno de filtros actual o inicializa uno vacío
    //    Usa optional chaining (?.) y nullish coalescing (||) por seguridad
    const currentFilters = { ...(oldFilterState?.filterBy || {}) };

    // 2. Lógica principal: Si el valor es "", elimina la clave del filtro.
    if (value === "" || value === null || value === undefined) {
        delete currentFilters[opt];
    } else {
    // 3. Si no, establece o actualiza el valor del filtro.
        currentFilters[opt] = value;
    }

    // 4. Devuelve el objeto en la estructura que useCrud espera recibir de esta función.
    return { filterBy: currentFilters };
}, []);



  const fields = useMemo(
    () => ({
      id: { rules: [], api: "e" },
      name: {
        rules: ["required"],
        api: "ae",
        label: "Nombre",
        form: { type: "text" },
        list: {},
      },
      start_date: {
        rules: ["required"],
        api: "ae",
        label: "Fecha Inicio",
        form: { type: "date" },
        list: { onRender: (props: any) => getDateStrMes(props.item.start_date) },
      },
      end_date: {
        rules: ["required"],
        api: "ae",
        label: "Fecha Fin",
        form: { type: "date" },
        list: { onRender: (props: any) => getDateStrMes(props.item.end_date) },
      },
      type: { // El tipo sigue siendo importante para saber si es Fijo/Variable
        rules: ["required"],
        api: "ae", // Se envía siempre (F o V)
        label: "Tipo",
        form: {
            type: "select",
            options: getTypeOptions(), // Opciones: Fijo, Variable
            defaultValue: "F"
        },
        list: { onRender: (props: any) => formatType(props.item.type) },
        filter: { label: "Tipo", options: () => getTypeOptions(true), width: "120px"},
      },
      amount: { // Ahora siempre se usa 'amount'
        rules: ["required", "number"], // Siempre requerido
        api: "ae",
        label: "Monto", // Etiqueta genérica
        form: {
            type: "number",
            placeholder: "Ej: 5000.00"
            // No necesita onHide
        },
        list: { onRender: (props: any) => `Bs ${formatNumber(props.item.amount)}` }, // Siempre muestra el amount
      },
      // ELIMINADOS: min_amount y max_amount
      period: {
        rules: ["required"],
        api: "ae",
        label: "Periodo",
        form: { type: "select", options: getPeriodOptions() },
        list: { onRender: (props: any) => formatPeriod(props.item.period) },
        filter: { label: "Periodo", options: () => getPeriodOptions(true), width: "150px" },
      },
      status: {
        rules: [], // No requerido en form si backend lo maneja
        api: "ae*", // Opcional enviarlo
        label: "Estado",
        form: {
            type: "select",
            options: getStatusOptions(),
            defaultValue: "D", // Default a Borrador
        },
        list: {
           onRender: (props: any) => {
             const statusText = formatStatus(props.item.status);
             return (<div className={`${styles.statusBadge} ${styles[`status${props.item.status}`] || ''}`}>{statusText}</div>);
           },
        },
        filter: { label: "Estado", options: () => getStatusOptions(true), width: "150px"},
      },
      category_id: {
        rules: ["required"],
        api: "ae",
        label: "Categoría",
        form: { type: "select", optionsExtra: "categories", placeholder: "Seleccione categoría" },
        list: { onRender: (props: any) => props.item.category?.name || "N/A" },
        filter: { label:"Categoría", options: getCategoryOptionsForFilter, width: "200px" }
      },
      user_id: { api: "e", label: "Creado por", list: { onRender: (props: any) => getFullName(props.item.user) || 'Sistema' } },
      approved_id: { api: "e", label: "Aprobado por", list: { onRender: (props: any) => getFullName(props.item.approved) || 'Pendiente' } },
    }),
    []
  );

  const { List, extraData } =
    useCrud({
      paramsInitial,
      mod,
      fields,
      getFilter: handleGetFilter,
    });

  if (!userCan(mod.permiso, "R")) return <NotAccess />;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{mod.plural}</h1>
      <p className={styles.subtitle}>
        Administre, agregue, edite y elimine {mod.plural.toLowerCase()}
      </p>
      <List />
    </div>
  );
};

export default Budget;