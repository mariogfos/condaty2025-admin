"use client";
import React, { useState, useMemo, useEffect, useCallback } from "react";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import styles from "./Budget.module.css";
import { getFullName } from "@/mk/utils/string";
import Button from "@/mk/components/forms/Button/Button";
import SendBudgetApprovalModal from "../ApprovalModal/BudgetApprovalModal";
import RenderForm from "./RenderForm/RenderForm";
import RenderView from "./RenderView/RenderView"; // <- Agregar import
import { IconCategories } from "@/components/layout/icons/IconsBiblioteca";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { useAuth } from "@/mk/contexts/AuthProvider";
import FormatBsAlign from "@/mk/utils/FormatBsAlign";
import { useEvent } from "@/mk/hooks/useEvents";

const paramsInitial = {
  perPage: 20, // <- Cambiado de 20 a -1 para cargar todos los registros
  page: 1,
  fullType: "L",
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
const amountCell = ({ item }: { item: any }) => {
  return item?.amount || item?.penalty_amount ? (
    <FormatBsAlign value={item.amount} alignRight={true} />
  ) : (
    "-/-"
  );
};

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
}

const renderStatusCell = (props: any) => {
  const statusConfig: Record<string, StatusConfig> = {
    D: {
      label: "Borrador",
      color: "var(--cInfo)",
      bgColor: "var(--cHoverCompl3)",
    },
    P: {
      label: "Pendiente por aprobar",
      color: "var(--cWarning)",
      bgColor: "var(--cHoverCompl4)",
    },
    A: {
      label: "Aprobado",
      color: "var(--cSuccess)",
      bgColor: "var(--cHoverCompl2)",
    },
    R: {
      label: "Rechazado",
      color: "var(--cError)",
      bgColor: "var(--cHoverError)",
    },
    C: {
      label: "Completado",
      color: "var(--cSuccess)",
      bgColor: "var(--cHoverCompl2)",
    },
    X: {
      label: "Cancelado",
      color: "var(--cWhite)",
      bgColor: "var(--cHoverCompl1)",
    },
  };

  const defaultConfig: StatusConfig = {
    label: "No disponible",
    color: "var(--cWhite)",
    bgColor: "var(--cHoverCompl1)",
  };

  const { label, color, bgColor } =
    statusConfig[props.item.status as keyof typeof statusConfig] ||
    defaultConfig;

  return (
    <StatusBadge color={color} backgroundColor={bgColor}>
      {label}
    </StatusBadge>
  );
};

const getPeriodOptions = (addDefault = false) => [
  ...(addDefault ? [{ id: "ALL", name: "Todos" }] : []),
  { id: "M", name: "Mensual" },
  { id: "B", name: "Semestral" },
  { id: "Q", name: "Trimestral" },
  { id: "Y", name: "Anual" },
];

const getStatusOptions = (addDefault = false) => [
  ...(addDefault ? [{ id: "ALL", name: "Todos" }] : []),
  { id: "D", name: "Borrador" },
  { id: "P", name: "Pendiente por aprobar" },
  { id: "A", name: "Aprobado" },
  { id: "R", name: "Rechazado" },
  { id: "C", name: "Completado" },
  { id: "X", name: "Cancelado" },
];

const getCategoryOptionsForFilter = (extraData: any) => [
  { id: "ALL", name: "Todos" },
  ...(extraData?.categories || []).map((cat: any) => ({
    id: cat.id,
    name: cat.name,
  })),
];

const Budget = () => {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleHideActions = (item: any) => {
    if (item?.status === "D") {
      return { hideEdit: false, hideDel: false, hideAdd: false };
    } else {
      return { hideEdit: true, hideDel: false, hideAdd: false };
    }
  };

  const mod: ModCrudType = useMemo(
    () => ({
      modulo: "budgets",
      singular: "Presupuesto",
      plural: "Presupuestos",
      permiso: "",
      extraData: true,
      filter: true,
      export: true,
      titleAdd: "Nuevo",
      saveMsg: {
        add: "Presupuesto creado con éxito",
        edit: "Presupuesto actualizado con éxito",
        del: "Presupuesto eliminado con éxito",
      },
      renderForm: (props: any) => <RenderForm {...props} />,
      renderView: (props: any) => <RenderView {...props} />,
      onHideActions: handleHideActions,
    }),
    []
  );

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
        list: {},
      },
      start_date: {
        rules: ["required"],
        api: "ae",
        label: "Fecha Inicio",
      },
      end_date: {
        rules: ["required"],
        api: "ae",
        label: "Fecha Fin",
      },
      category_id: {
        rules: ["required"],
        api: "ae",
        label: "Subcategoría",
        list: { onRender: (props: any) => props.item.category?.name || "N/A" },
        filter: {
          label: "Subcategoría",
          options: getCategoryOptionsForFilter,
          width: "200px",
        },
      },
      period: {
        rules: ["required"],
        api: "ae",
        label: "Periodo",
        list: { onRender: (props: any) => formatPeriod(props.item.period) },
        filter: {
          label: "Periodo",
          options: () => getPeriodOptions(true),
          width: "150px",
        },
      },
      status: {
        rules: [],
        api: "ae*",
        label: (
          <span
            style={{ display: "block", textAlign: "center", width: "100%" }}
          >
            Estado
          </span>
        ),
        list: { onRender: renderStatusCell },
        filter: {
          label: "Estado",
          options: () => getStatusOptions(true),
          width: "150px",
        },
      },
      amount: {
        rules: ["required", "number"],
        api: "ae",
        label: "Monto",
        style: { textAlign: "right", justifyContent: "flex-end" },
        list: {
          onRender: amountCell,
        },
      },
      user_id: {
        api: "e",
        label: "Creado por",
        list: false,
        onRender: (props: any) => getFullName(props.item?.user) || "Sistema",
      },
      approved: {
        api: "e",
        label: "Aprobado por",
        list: false,
        onRender: (props: any) =>
          getFullName(props.item?.approved) || "Pendiente",
      },
    }),
    []
  );

  const handleConfirmSendToApproval = async () => {
    setIsSending(true);
    try {
      const { data: response, error } = await execute(
        "/send-budget-approval",
        "POST",
        {},
        false,
        false
      );
      if (response?.success) {
        showToast(
          response?.message ||
            "Presupuestos enviados a aprobación exitosamente.",
          "success"
        );
        if (reLoad) reLoad();
        setIsConfirmModalOpen(false);
      } else {
        throw new Error(
          response?.message ||
            error?.message ||
            "Error desconocido al enviar los presupuestos."
        );
      }
    } catch (err: any) {
      showToast(err.message, "error");
      console.error("Error enviando presupuestos a aprobación:", err);
    } finally {
      setIsSending(false);
    }
  };

  const sendToApprovalButton = (
    <Button
      key="send-approval-btn"
      onClick={() => setIsConfirmModalOpen(true)}
      variant="secondary"
      style={{ minWidth: "180px" }}
    >
      Enviar a Aprobación
    </Button>
  );

  const { List, extraData, data, loaded, showToast, userCan, execute, reLoad } =
    useCrud({
      paramsInitial,
      mod,
      fields,
      getFilter: handleGetFilter,
      extraButtons: [sendToApprovalButton],
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
  const onNotif = useCallback((e: any) => {
    if (e.event == "change-budget") {
      reLoad();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEvent("onNotif", onNotif);

  const { setStore, store } = useAuth();
  useEffect(() => {
    setStore({ ...store, title: "Presupuestos" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.container}>
      <List
        height={"calc(100vh - 360px)"}
        emptyMsg="Lista de presupuesto vacía. Una vez crees los items "
        emptyLine2="para tu presupuesto, los verás aquí."
        emptyIcon={<IconCategories size={80} color="var(--cWhiteV1)" />}
        filterBreakPoint={1700}
      />

      {/* Eliminar el botón de aquí */}

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
