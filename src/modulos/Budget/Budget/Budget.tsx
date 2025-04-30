"use client";
import React, { useState, useMemo, useEffect, useCallback } from "react";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import styles from "./Budget.module.css";
import { formatNumber } from "@/mk/utils/numbers";
import { getDateStrMes } from "@/mk/utils/date";
import { getFullName } from "@/mk/utils/string";
import { useAuth } from "@/mk/contexts/AuthProvider"; // Probablemente no necesites importar useAuth aquí directamente
import Button from "@/mk/components/forms/Button/Button";
import SendBudgetApprovalModal from "../ApprovalModal/BudgetApprovalModal";


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
    return map[typeCode] || "Fijo";
};
const formatStatus = (statusCode: string): string => {
    const map: Record<string, string> = { D: "Borrador", P: "Pendiente Aprobación", A: "Aprobado", R: "Rechazado", C: "Completado", X: "Cancelado" };
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
    { id: "D", name: "Borrador" }, { id: "P", name: "Pendiente Aprobación" }, { id: "A", name: "Aprobado" }, { id: "R", name: "Rechazado" }, { id: "C", name: "Completado" }, { id: "X", name: "Cancelado" }
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
  // --- Estado para controlar el modal de confirmación ---
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  // --- Estado opcional para la carga de la acción de envío ---
  const [isSending, setIsSending] = useState(false);

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
        id: { rules: [], api: "e" },
        name: { rules: ["required"], api: "ae", label: "Nombre", form: { type: "text" }, list: {}, },
        start_date: { rules: ["required"], api: "ae", label: "Fecha Inicio", form: { type: "date" }, list: { onRender: (props: any) => getDateStrMes(props.item.start_date) }, },
        end_date: { rules: ["required"], api: "ae", label: "Fecha Fin", form: { type: "date" }, list: { onRender: (props: any) => getDateStrMes(props.item.end_date) }, },
        type: { rules: ["required"], api: "ae", label: "Tipo", form: { type: "select", options: getTypeOptions(), defaultValue: "F" }, list: { onRender: (props: any) => formatType(props.item.type) }, filter: { label: "Tipo", options: () => getTypeOptions(true), width: "120px"}, },
        amount: { rules: ["required", "number"], api: "ae", label: "Monto", form: { type: "number", placeholder: "Ej: 5000.00" }, list: { onRender: (props: any) => `Bs ${formatNumber(props.item.amount)}` }, },
        period: { rules: ["required"], api: "ae", label: "Periodo", form: { type: "select", options: getPeriodOptions() }, list: { onRender: (props: any) => formatPeriod(props.item.period) }, filter: { label: "Periodo", options: () => getPeriodOptions(true), width: "150px" }, },
        status: { rules: [], api: "ae*", label: "Estado", form: { type: "select", options: getStatusOptions(), defaultValue: "D", }, list: { onRender: (props: any) => { const statusText = formatStatus(props.item.status); return (<div className={`${styles.statusBadge} ${styles[`status${props.item.status}`] || ''}`}>{statusText}</div>); }, }, filter: { label: "Estado", options: () => getStatusOptions(true), width: "150px"}, },
        category_id: { rules: ["required"], api: "ae", label: "Categoría", form: { type: "select", optionsExtra: "categories", placeholder: "Seleccione categoría" }, list: { onRender: (props: any) => props.item.category?.name || "N/A" }, filter: { label:"Categoría", options: getCategoryOptionsForFilter, width: "200px" } },
        user_id: { api: "e", label: "Creado por", list: { onRender: (props: any) => getFullName(props.item.user) || 'Sistema' } },
        approved_id: { api: "e", label: "Aprobado por", list: { onRender: (props: any) => getFullName(props.item.approved) || 'Pendiente' } },
    }),
    []
  );
  const handleConfirmSendToApproval = async () => {
    console.log("Enviando presupuestos a aprobación...");
    setIsSending(true); // Inicia estado de carga

    try {
        // Llama al endpoint específico con POST, sin payload adicional
        const { data: response, error } = await execute(
             '/send-budget-approval', // El endpoint que especificaste
             'POST',                 // Método POST
             {},                     // Payload vacío (un objeto vacío es lo más seguro)
             false,                  // noWaiting: esperar la respuesta
             false                   // noGenericError: podemos manejar el error aquí
         );

         // Revisa la respuesta de la API
         if (response?.success) {
             // Éxito: Muestra mensaje, recarga la lista y cierra el modal
             showToast(response?.message || 'Presupuestos enviados a aprobación exitosamente.', 'success');
             if (reLoad) reLoad(); // Recarga la lista para reflejar cambios
             setIsConfirmModalOpen(false); // Cierra el modal de confirmación
         } else {
            // Si success no es true, o hubo un error capturado por useAxios
            throw new Error(response?.message || error?.message || 'Error desconocido al enviar los presupuestos.');
         }
    } catch (err: any) {
         // Muestra el error en un toast
         showToast(err.message, 'error');
         console.error("Error enviando presupuestos a aprobación:", err);
         // Considera si quieres cerrar el modal aquí o dejarlo abierto
         // setIsConfirmModalOpen(false);
    } finally {
         setIsSending(false); // Termina estado de carga, haya éxito o error
    }
  };
  const sendToApprovalButton = (
    <Button
        onClick={() => {
          setIsConfirmModalOpen(true);
        }}
        variant="secondary"
        style={{ minWidth: '180px' }}
    >
        Enviar a Aprobación
    </Button>
);

  const { List, extraData, data, loaded, showToast, userCan ,execute, reLoad} =
    useCrud({
      paramsInitial,
      mod,
      fields,
      getFilter: handleGetFilter,
      extraButtons: [sendToApprovalButton]
    });

  useEffect(() => {
    if (loaded && data) {
      if (data.success === true && data.data && !Array.isArray(data.data) && typeof data.data.msg === 'string') {
        showToast(data.data.msg, 'error');
      }
    }
  }, [data, loaded, showToast]);
  return (
    <div className={styles.container}>
      <List />
      <SendBudgetApprovalModal
        open={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)} // Cierra el modal al cancelar
        onConfirm={handleConfirmSendToApproval}     // Llama a la función de confirmación
        isLoading={isSending}                       // Pasa el estado de carga
      />
    </div>
  );
};

export default Budget;