"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import styles from "./Assemblies.module.css";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import { WidgetDashCard } from "@/components/Widgets/WidgetsDashboard/WidgetDashCard/WidgetDashCard";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { IconCalendar } from "@/components/layout/icons/IconsBiblioteca";
import { formatToDayDDMMYYYYHHMM } from "@/mk/utils/date";
import RenderForm from "./RenderForm/RenderForm";
import { Assembly } from "./types/assemblies.types";
import {
  API_STATUS_LABELS,
  STATUS_OPTIONS,
  STATUS_STYLE,
  TYPE_OPTIONS,
  MODALITY_OPTIONS,
} from "./config/assemblies.constants";

const paramsInitial = {
  fullType: "L",
  perPage: 20,
  page: 1,
  searchBy: "",
};

const Assemblies = () => {
  const router = useRouter();

  const mod: ModCrudType = {
    modulo: "assemblies",
    singular: "Asambleas",
    plural: "Asambleas",
    permiso: "units",
    search: true,
    filter: true,
    titleAdd: "Crear asamblea",
    hideActions: {
      view: false,
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
      start_time: {
        rules: ["required"],
        api: "ae",
        label: "Fecha y hora",
        list: {
          width: "230px",
          onRender: (props: any) => {
            const rawDateTime = props?.item?.start_time || "";
            if (!rawDateTime) return "-";
            return formatToDayDDMMYYYYHHMM(rawDateTime, false);
          },
        },
      },
      end_time: {
        rules: ["required"],
        api: "ae",
        label: "Fecha fin",
        list: false,
      },
      meeting_url: { rules: [], api: "ae", label: "Enlace", list: false },
      address: { rules: [], api: "ae", label: "Dirección", list: false },
      address_url: {
        rules: [],
        api: "ae",
        label: "URL ubicación",
        list: false,
      },
      files: { rules: [], api: "ae", label: "Documentos", list: false },
      declarations: {
        rules: [],
        api: "ae",
        label: "Declaraciones",
        list: false,
      },
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
                <StatusBadge
                  color={style.color}
                  backgroundColor={style.backgroundColor}
                >
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
      quorum_required: {
        rules: [],
        api: "ae",
        label: "Quórum requerido",
        list: false,
      },
      anonymous_voting: {
        rules: [],
        api: "ae",
        label: "Votación anónima",
        list: false,
      },
      target_audience: {
        rules: [],
        api: "ae",
        label: "Audiencia",
        list: false,
      },
    }),
    [],
  );

  const { userCan, List, data } = useCrud({
    paramsInitial,
    mod,
    fields,
  });

  const handleRowClick = (item: Assembly) => {
    console.log("click en fila", item);
    router.push(`/assemblies/${item.id}`);
  };

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
        <WidgetDashCard
          title="Programadas"
          data={pending}
          style={{ minWidth: "160px", maxWidth: "260px" }}
        />
        <WidgetDashCard
          title="En progreso"
          data={inProgress}
          style={{ minWidth: "160px", maxWidth: "260px" }}
        />
        <WidgetDashCard
          title="Finalizadas"
          data={completed}
          style={{ minWidth: "160px", maxWidth: "260px" }}
        />
        <WidgetDashCard
          title="Canceladas"
          data={canceled}
          style={{ minWidth: "160px", maxWidth: "260px" }}
        />
      </div>

      <div className={styles.listContainer}>
        <List
          title="Asambleas"
          height={"calc(100vh - 420px)"}
          emptyMsg="Lista vacía. Cuando registres asambleas"
          emptyLine2="las verás aquí."
          emptyIcon={<IconCalendar size={80} color="var(--cWhiteV1)" />}
          onRowClick={handleRowClick}
        />
      </div>
    </div>
  );
};

export default Assemblies;
