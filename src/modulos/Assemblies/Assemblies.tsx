"use client";

import React, { useMemo, useState } from "react";
import styles from "./Assemblies.module.css";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import { WidgetDashCard } from "@/components/Widgets/WidgetsDashboard/WidgetDashCard/WidgetDashCard";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { IconCalendar } from "@/components/layout/icons/IconsBiblioteca";
import { formatToDayDDMMYYYYHHMM } from "@/mk/utils/date";
import RenderForm from "./RenderForm/RenderForm";
import AssemblyDetailModal from "./components/AssemblyDetailModal/AssemblyDetailModal";
import { Assembly, STATUS_LABELS, TYPE_LABELS, MODALITY_LABELS } from "./types/assemblies.types";

const paramsInitial = {
  fullType: "L",
  perPage: 20,
  page: 1,
  searchBy: "",
};

// Labels actualizados para coincidir con la API (S, P, C, X)
const API_STATUS_LABELS: Record<string, string> = {
  S: "Programada",
  P: "En progreso",
  C: "Completada",
  X: "Cancelada",
};

const STATUS_STYLE: Record<string, { color: string; backgroundColor: string }> = {
  S: { color: "var(--cWarning)", backgroundColor: "var(--cHoverCompl4)" },
  P: { color: "#FFCF4A", backgroundColor: "rgba(255, 207, 74, 0.15)" },
  C: { color: "var(--cSuccess)", backgroundColor: "var(--cHoverSuccess)" },
  X: { color: "var(--cError)", backgroundColor: "var(--cHoverError)" },
};

const STATUS_OPTIONS = [
  { id: "ALL", name: "Todos" },
  { id: "S", name: "Programada" },
  { id: "P", name: "En progreso" },
  { id: "C", name: "Completada" },
  { id: "X", name: "Cancelada" },
];

const TYPE_OPTIONS = [
  { id: "O", name: "Ordinaria" },
  { id: "E", name: "Extraordinaria" },
  { id: "I", name: "Informativa" },
];

const MODALITY_OPTIONS = [
  { id: "V", name: "Virtual" },
  { id: "I", name: "Presencial" },
  { id: "H", name: "Híbrida" },
];

const Assemblies = () => {
  const [selectedAssembly, setSelectedAssembly] = useState<Assembly | null>(null);
  
  const mod: ModCrudType = {
    modulo: "assemblies",
    singular: "Asambleas",
    plural: "Asambleas",
    permiso: "units",
    search: true,
    filter: true,
    titleAdd: "Crear asamblea",
    hideActions: {
      view: false, // Habilitamos view para abrir el modal de detalle
      edit: true,
      del: true,
    },
    saveMsg: {
      add: "Asambleas creada con éxito",
      edit: "Asambleas actualizada con éxito",
      del: "Asambleas eliminada con éxito",
    },
    renderForm: (props: any) => <RenderForm {...props} />,
    // Custom renderView para el modal de detalle
    renderView: (props: any) => {
      const { item } = props;
      return (
        <AssemblyDetailModal
          assembly={item as Assembly}
          onClose={() => {}}
          onUpdate={(updated) => {
            // Actualizar el item en la lista si es necesario
            props?.reLoad?.();
          }}
        />
      );
    },
  };

  const fields = useMemo(
    () => ({
      id: { rules: [], api: "e" },
      subject: {
        rules: ["required"],
        api: "ae",
        label: "Asunto",
        list: true,
      },
      description: {
        rules: ["required"],
        api: "ae",
        label: "Descripción",
        list: false,
      },
      type: {
        rules: ["required"],
        api: "ae",
        label: "Tipo",
        list: {
          width: "130px",
          onRender: (props: any) => {
            const rowType = props?.item?.type;
            const found = TYPE_OPTIONS.find((it) => it.id === rowType);
            return found?.name || rowType || "-";
          },
        },
      },
      modality: {
        rules: ["required"],
        api: "ae",
        label: "Modalidad",
        list: {
          width: "130px",
          onRender: (props: any) => {
            const rowModality = props?.item?.modality;
            const found = MODALITY_OPTIONS.find((it) => it.id === rowModality);
            return found?.name || rowModality || "-";
          },
        },
      },
      start_date: {
        rules: ["required"],
        api: "ae",
        label: "Fecha",
        list: {
          width: "230px",
          onRender: (props: any) => {
            const rawDate = props?.item?.start_date || "";
            const date = String(rawDate).split("T")[0] || "";
            const time = String(props?.item?.start_time || "").slice(0, 5);
            if (!date) return "-";
            const dateTime = `${date} ${time || "00:00"}`;
            return formatToDayDDMMYYYYHHMM(dateTime, false);
          },
        },
      },
      start_time: { rules: ["required"], api: "ae", label: "Hora inicio", list: false },
      end_date: { rules: ["required"], api: "ae", label: "Fecha fin", list: false },
      end_time: { rules: ["required"], api: "ae", label: "Hora fin", list: false },
      meeting_url: { rules: [], api: "ae", label: "Enlace", list: false },
      address: { rules: [], api: "ae", label: "Dirección", list: false },
      address_url: { rules: [], api: "ae", label: "URL ubicación", list: false },
      files: { rules: [], api: "ae", label: "Documentos", list: false },
      declarations: { rules: [], api: "ae", label: "Declaraciones", list: false },
      status: {
        rules: ["required"],
        api: "ae",
        label: "Estado",
        list: {
          width: "140px",
          onRender: (props: any) => {
            const status = props?.item?.status;
            if (!status) return "-";
            const style = STATUS_STYLE[status] || {
              color: "var(--cWhite)",
              backgroundColor: "var(--cHover)",
            };
            return (
              <div className={styles.statusCell}>
                <StatusBadge color={style.color} backgroundColor={style.backgroundColor}>
                  {API_STATUS_LABELS[status] || status}
                </StatusBadge>
              </div>
            );
          },
        },
        filter: {
          label: "Estado",
          options: () => STATUS_OPTIONS,
        },
      },
      // Campos adicionales para la configuración
      quorum_required: { rules: [], api: "ae", label: "Quórum requerido", list: false },
      anonymous_voting: { rules: [], api: "ae", label: "Votación anónima", list: false },
      target_audience: { rules: [], api: "ae", label: "Audiencia", list: false },
    }),
    [],
  );

  const { userCan, List, data, reLoad } = useCrud({
    paramsInitial,
    mod,
    fields,
  });

  const metrics = data?.message || {};
  const total = metrics?.total ?? 0;
  const pending = metrics?.S ?? 0;
  const inProgress = metrics?.P ?? 0;
  const completed = metrics?.C ?? 0;
  const canceled = metrics?.X ?? 0;

  if (!userCan(mod.permiso, "R")) return <NotAccess />;

  return (
    <div className={styles.assemblies}>
      <h1 className={styles.title}>Asambleas</h1>

      <div className={styles.statsRow}>
        <WidgetDashCard
          title="Total"
          data={total}
          style={{ minWidth: "160px", maxWidth: "260px" }}
          icon={<IconCalendar color="var(--cInfo)" circle size={18} />}
        />
        <WidgetDashCard title="Programadas" data={pending} style={{ minWidth: "160px", maxWidth: "260px" }} />
        <WidgetDashCard title="En progreso" data={inProgress} style={{ minWidth: "160px", maxWidth: "260px" }} />
        <WidgetDashCard title="Completadas" data={completed} style={{ minWidth: "160px", maxWidth: "260px" }} />
        <WidgetDashCard title="Canceladas" data={canceled} style={{ minWidth: "160px", maxWidth: "260px" }} />
      </div>

      <div className={styles.listContainer}>
        <List
          title="Asambleas"
          height={"calc(100vh - 420px)"}
          emptyMsg="Lista vacía. Cuando registres asambleas"
          emptyLine2="las verás aquí."
          emptyIcon={<IconCalendar size={80} color="var(--cWhiteV1)" />}
        />
      </div>

      {/* Modal de detalle */}
      {selectedAssembly && (
        <AssemblyDetailModal
          assembly={selectedAssembly}
          onClose={() => setSelectedAssembly(null)}
          onUpdate={(updated) => {
            setSelectedAssembly(updated);
            reLoad();
          }}
        />
      )}
    </div>
  );
};

export default Assemblies;