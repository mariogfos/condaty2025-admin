"use client";
import React, { useState, useMemo, useEffect, useCallback } from "react";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud"; // Asegúrate que ModCrudType incluya onHideActions? : Function
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import styles from "./Budget.module.css";
import { formatNumber } from "@/mk/utils/numbers";
import { getDateStrMes } from "@/mk/utils/date";
import { getFullName } from "@/mk/utils/string";
// import { useAuth } from "@/mk/contexts/AuthProvider"; // No es necesario aquí si usas useCrud
import Button from "@/mk/components/forms/Button/Button";
import SendBudgetApprovalModal from "../ApprovalModal/BudgetApprovalModal";
import RenderForm from "./RenderForm/RenderForm";


const paramsInitial = {
  perPage: 20,
  page: 1,
  fullType: "L",
  searchBy: "",
};

// --- Funciones de formato y opciones (sin cambios) ---
const formatPeriod = (periodCode: string): string => {
    const map: Record<string, string> = { D: "Diario", W: "Semanal", F: "Quincenal", M: "Mensual", B: "Bimestral", Q: "Trimestral", S: "Semestral", Y: "Anual" };
    return map[periodCode] || periodCode;
};
const formatType = (typeCode: string): string => {
    const map: Record<string, string> = { F: "Fijo", V: "Variable" };
    return map[typeCode] || "Fijo";
};
const formatStatus = (statusCode: string): string => {
    // Mapa de estados: D=Borrador, P=Pendiente, A=Aprobado, R=Rechazado, C=Completado, X=Cancelado
    const map: Record<string, string> = { D: "Borrador", P: "Pendiente Aprobación", A: "Aprobado", R: "Rechazado", C: "Completado", X: "Cancelado" };
    return map[statusCode] || statusCode;
};
const getPeriodOptions = (addDefault = false) => [
    ...(addDefault ? [{ id: "T", name: "Todos" }] : []),
    { id: "M", name: "Mensual" }, { id: "B", name: "Bimestral" }, { id: "Q", name: "Trimestral" }, { id: "S", name: "Semestral" }, { id: "Y", name: "Anual" }
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
// --- Fin Funciones de formato y opciones ---


const Budget = () => {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // --- MODIFICACIÓN AQUÍ: Nueva lógica simple en handleHideActions ---
  const handleHideActions = (item: any) => {
    // Si el estado es 'X' (Cancelado), MOSTRAR ambos botones
    if (item?.status === 'X') {
      // No ocultar ni editar ni borrar
      return { hideEdit: false, hideDel: false }; // O return {};
    }
    // Para CUALQUIER OTRO estado ('A', 'P', 'R', 'D', 'C', etc.), OCULTAR ambos botones
    else {
      // Ocultar editar y ocultar borrar
      return { hideEdit: true, hideDel: true };
    }
  };
  // --- FIN MODIFICACIÓN ---

  const mod: ModCrudType = useMemo(() => ({
      modulo: "budgets",
      singular: "Presupuesto",
      plural: "Presupuestos",
      permiso: "",
      extraData: true,
      filter: true,
      saveMsg: { add: "Presupuesto creado con éxito", edit: "Presupuesto actualizado con éxito", del: "Presupuesto eliminado con éxito" },
      renderForm: (props: any) => <RenderForm {...props} />,
      onHideActions: handleHideActions, // <-- Se usa la función actualizada
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);


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
        amount: { rules: ["required", "number"], api: "ae", label: "Monto", form: { type: "number", placeholder: "Ej: 5000.00" }, list: { onRender: (props: any) => `Bs ${formatNumber(props.item.amount)}` }, },
        period: { rules: ["required"], api: "ae", label: "Periodo", form: { type: "select", options: getPeriodOptions() }, list: { onRender: (props: any) => formatPeriod(props.item.period) }, filter: { label: "Periodo", options: () => getPeriodOptions(true), width: "150px" }, },
        // Status: Asegúrate que la clase CSS exista para cada estado (statusA, statusR, etc.)
        status: { rules: [], api: "ae*", label: "Estado", list: { onRender: (props: any) => { const statusText = formatStatus(props.item.status); return (<div className={`${styles.statusBadge} ${styles[`status${props.item.status}`] || ''}`}>{statusText}</div>); }, }, filter: { label: "Estado", options: () => getStatusOptions(true), width: "150px"}, },
        category_id: { rules: ["required"], api: "ae", label: "Categoría", form: { type: "select", optionsExtra: "categories", placeholder: "Seleccione categoría" }, list: { onRender: (props: any) => props.item.category?.name || "N/A" }, filter: { label:"Categoría", options: getCategoryOptionsForFilter, width: "200px" } },
        user_id: { api: "e", label: "Creado por", list: { onRender: (props: any) => getFullName(props.item.user) || 'Sistema' } },
        approved: { api: "e", label: "Aprobado por", list: { onRender: (props: any) => getFullName(props.item.approved) || 'Pendiente' } },
    }),
    []
  );

  // --- Lógica para enviar a aprobación (sin cambios relevantes para esta lógica) ---
  const handleConfirmSendToApproval = async () => {
    // ... (código sin cambios)
    setIsSending(true);
    try {
        const { data: response, error } = await execute(
             '/send-budget-approval',
             'POST',
             {},
             false,
             false
         );
         if (response?.success) {
             showToast(response?.message || 'Presupuestos enviados a aprobación exitosamente.', 'success');
             if (reLoad) reLoad();
             setIsConfirmModalOpen(false);
         } else {
            throw new Error(response?.message || error?.message || 'Error desconocido al enviar los presupuestos.');
         }
    } catch (err: any) {
         showToast(err.message, 'error');
         console.error("Error enviando presupuestos a aprobación:", err);
    } finally {
         setIsSending(false);
    }
  };
  const sendToApprovalButton = (
    <Button
        key="send-approval-btn" // Añadir key única si está en un array
        onClick={() => setIsConfirmModalOpen(true)}
        variant="secondary"
        style={{ minWidth: '180px' }}
    >
        Enviar a Aprobación
    </Button>
  );
  // --- Fin lógica para enviar a aprobación ---


  const { List, extraData, data, loaded, showToast, userCan ,execute, reLoad} =
    useCrud({
      paramsInitial,
      mod, // Pasamos el mod actualizado con la nueva onHideActions
      fields,
      getFilter: handleGetFilter,
      extraButtons: [sendToApprovalButton] // Botones extras se mantienen
    });

  // --- useEffect para mostrar errores (sin cambios) ---
  useEffect(() => {
    // ... (código sin cambios)
     if (loaded && data) {
      if (data.success === true && data.data && !Array.isArray(data.data) && typeof data.data.msg === 'string') {
        showToast(data.data.msg, 'error');
      }
    }
  }, [data, loaded, showToast]);

  // --- Renderizado del componente (sin cambios) ---
  return (
    <div className={styles.container}>
      {/* Renderiza la lista que ahora usará onHideActions para los botones */}
      <List />
      <SendBudgetApprovalModal
        open={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmSendToApproval}
        isLoading={isSending}
      />
    </div>
  );
};

export default Budget;