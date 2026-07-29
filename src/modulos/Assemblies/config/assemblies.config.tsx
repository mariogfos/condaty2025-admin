// src/modulos/Assemblies/config/assemblies.config.tsx
import React from "react";
import { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import { formatToDayDDMMYYYYHHMM } from "@/mk/utils/date";
import { getPeriodOptions } from "@/mk/utils/periodFilterOptions";
import RenderForm from "../RenderForm/RenderForm";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import styles from "../Assemblies.module.css";
import {
  API_STATUS_LABELS,
  STATUS_OPTIONS,
  STATUS_STYLE,
  TYPE_OPTIONS,
  MODALITY_OPTIONS,
} from "./assemblies.constants";
import { IconDownload } from "@/components/layout/icons/IconsBiblioteca";

export const getAssemblyConfig = (
  reLoad: any,
  onEdit?: (item: any) => void,
  onCloseView?: () => void,
): { mod: ModCrudType; fields: any } => {
  const mod: ModCrudType = {
    modulo: "assemblies",
    singular: "Asamblea",
    plural: "Asambleas",
    permiso: "units",
    search: true,
    filter: true,
    titleAdd: "Crear",
    // S140 (bug #10 backlog Mario 2026-07-28): faltaba slot `exportAsync`
    // en la lista de Asambleas. Pineamos `assembly-attendances`
    // (AssemblyAttendancesReportType, S110 pre-existente) que es el
    // ReportType más cercano a "asambleas" en el back. useCrud
    // auto-renderea el AsyncExportButton (S36.5 pattern).
    export: false,
    exportAsync: {
      type: "assembly-attendances",
      format: "pdf",
      label: "Exportar PDF",
    },
    hideActions: {
      view: false,
      edit: false,
      del: false,
    },
    saveMsg: {
      add: "Asamblea creada con éxito",
      edit: "Asamblea actualizada con éxito",
      del: "Asamblea eliminada con éxito",
    },
    onHideActions: (item: any) => {
      const hasAttendances = (item.attendances_count || 0) > 0;
      const notScheduled = item.status !== "S";
      return {
        hideEdit: hasAttendances || notScheduled,
        hideDel: hasAttendances || notScheduled,
      };
    },
    renderForm: (props: any) => <RenderForm {...props} />,
  };

  const fields = {
    id: { rules: [], api: "e" },
    subject: {
      rules: ["required"],
      api: "ae",
      label: "Asamblea",
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
      filter: {
        label: "Tipo",
        options: () => [{ id: "ALL", name: "Todos" }, ...TYPE_OPTIONS],
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
      filter: {
        label: "Modalidad",
        options: () => [{ id: "ALL", name: "Todos" }, ...MODALITY_OPTIONS],
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
      filter: {
        key: "start_time",
        label: "Período",
        options: getPeriodOptions,
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
    acta_file: {
      rules: [],
      api: "e",
      label: "Acta",
      list: {
        width: "80px",
        onRender: (props: any) => {
          const actaFile = props?.item?.acta_file;
          if (!actaFile) return null;
          return (
            <div className={styles.statusCell}>
              <a
                href={actaFile}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{ display: "inline-flex", alignItems: "center" }}
              >
                <IconDownload size={18} color="var(--cAccent)" />
              </a>
            </div>
          );
        },
      },
    },
  };

  return { mod, fields };
};
