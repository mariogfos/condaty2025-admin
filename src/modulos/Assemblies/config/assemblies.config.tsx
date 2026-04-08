// src/modulos/Assemblies/config/assemblies.config.tsx
import React from "react";
import { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import { formatToDayDDMMYYYYHHMM } from "@/mk/utils/date";
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

  const fields = {
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
  };

  return { mod, fields };
};
