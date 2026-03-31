"use client";

import React, { useMemo } from "react";
import styles from "./Assemblies.module.css";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import { WidgetDashCard } from "@/components/Widgets/WidgetsDashboard/WidgetDashCard/WidgetDashCard";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { IconCalendar } from "@/components/layout/icons/IconsBiblioteca";
import { formatToDayDDMMYYYYHHMM } from "@/mk/utils/date";
import RenderForm from "./RenderForm/RenderForm";

const paramsInitial = {
  fullType: "L",
  perPage: 20,
  page: 1,
  searchBy: "",
};

const STATUS_LABELS: Record<string, string> = {
  Scheduled: "Pendiente",
  InProgress: "En progreso",
  Completed: "Completada",
  Canceled: "Cancelada",
};

const STATUS_STYLE: Record<string, { color: string; backgroundColor: string }> = {
  Scheduled: { color: "var(--cWarning)", backgroundColor: "var(--cHoverCompl4)" },
  InProgress: { color: "#FFCF4A", backgroundColor: "rgba(255, 207, 74, 0.15)" },
  Completed: { color: "var(--cSuccess)", backgroundColor: "var(--cHoverSuccess)" },
  Canceled: { color: "var(--cError)", backgroundColor: "var(--cHoverError)" },
};

const STATUS_OPTIONS = [
  { id: "ALL", name: "Todos" },
  { id: "Scheduled", name: "Pendiente" },
  { id: "InProgress", name: "En progreso" },
  { id: "Completed", name: "Completada" },
  { id: "Canceled", name: "Cancelada" },
];

const TYPE_OPTIONS = [
  { id: "Ordinary", name: "Ordinaria" },
  { id: "Extraordinary", name: "Extraordinaria" },
  { id: "Informative", name: "Informativa" },
];

const MODALITY_OPTIONS = [
  { id: "Virtual", name: "Virtual" },
  { id: "Presential", name: "Presencial" },
  { id: "Hybrid", name: "Híbrida" },
];

const Assemblies = () => {
  const mod: ModCrudType = {
    modulo: "assemblies",
    singular: "Asamblea",
    plural: "Asambleas",
    permiso: "units",
    search: true,
    filter: true,
    titleAdd: "Crear asamblea",
    hideActions: {
      view: true,
      edit: true,
      del: true,
    },
    saveMsg: {
      add: "Asamblea creada con éxito",
      edit: "Asamblea actualizada con éxito",
      del: "Asamblea eliminada con éxito",
    },
    renderForm: (props: any) => <RenderForm {...props} />,
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
      physical_address: { rules: [], api: "ae", label: "Dirección", list: false },
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
                  {STATUS_LABELS[status] || status}
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
    }),
    [],
  );

  const { userCan, List, data } = useCrud({
    paramsInitial,
    mod,
    fields,
  });

  const metrics = data?.message || {};
  const total = metrics?.total ?? 0;
  const pending = metrics?.pending ?? metrics?.scheduled ?? 0;
  const inProgress = metrics?.in_progress ?? metrics?.inProgress ?? 0;
  const completed = metrics?.completed ?? 0;
  const canceled = metrics?.canceled ?? metrics?.cancelled ?? 0;

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
        <WidgetDashCard title="Pendientes" data={pending} style={{ minWidth: "160px", maxWidth: "260px" }} />
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
    </div>
  );
};

export default Assemblies;
