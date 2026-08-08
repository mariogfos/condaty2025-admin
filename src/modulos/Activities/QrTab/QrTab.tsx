/* eslint-disable react-hooks/exhaustive-deps */
import React, { useMemo } from "react";
import styles from "../Activities.module.css";
import { getDateStrMes } from "@/mk/utils/date";
import { getFullName } from "@/mk/utils/string";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import { IconGroupsQr, IconSingleQr } from "@/components/layout/icons/IconsBiblioteca";
import RenderView from "./RenderView/RenderView";

interface QRTabProps {
  paramsInitial: any;
  /**
   * ⚠️ Opcional: el detalle de una invitación lo abre `useCrud` con el
   * `renderView` del propio módulo. Sólo hace falta cuando quien monta la lista
   * quiere hacer algo distinto al hacer clic.
   */
  onRowClick?: (item: any) => void;
}

/**
 * Los tres tipos de invitación, con las palabras que ya usa el detalle.
 *
 * ⚠️ Las mismas que imprime `InvitacionesExportConfig` en el back: la lista y
 * el reporte tienen que decir lo mismo.
 */
const INVITATION_TYPE_LABELS: Record<string, string> = {
  I: "Individual",
  G: "Grupal",
  F: "Frecuente",
};

/**
 * ⚠️ Los valores viajan al back en `filterBy` y los interpreta
 * `InvitationController::porEstado()`. Son las palabras que la lista MUESTRA,
 * no los cuatro chars de `invitations.status` —'O', 'A', 'I', 'X'— que el
 * usuario no ve por ningún lado: un filtro que hable otro idioma que la
 * columna filtra por algo distinto de lo que se está mirando.
 */
const getStatusOptions = () => [
  { id: "ALL", name: "Todos" },
  { id: "ACTIVA", name: "Activa" },
  { id: "EXPIRADA", name: "Expirada" },
  { id: "ANULADA", name: "Anulada" },
];

const getTypeOptions = () => [
  { id: "ALL", name: "Todos" },
  ...Object.entries(INVITATION_TYPE_LABELS).map(([id, name]) => ({ id, name })),
];
// Función actualizada para obtener las opciones de período
const getPeriodOptions = () => [
  { id: "t", name: "Todos" },
  { id: "week", name: "Esta Semana" },
  { id: "lweek", name: "Ant. Semana" },
  { id: "month", name: "Este Mes" },
  { id: "lmonth", name: "Ant. Mes" }
];

const QRTab: React.FC<QRTabProps> = ({ paramsInitial, onRowClick }) => {
  // Definición del módulo QR
  const modQR: ModCrudType = useMemo(() => {
    return {
      modulo: "v3/invitations",
      singular: "Invitación",
      plural: "Invitaciones QR",
      filter: true,
      permiso: "",
      // S65.5 (HALLAZGO-NEW-61): migrado al slot async S36.5.
      export: false,
      exportAsync: {
        type: "invitations",
        format: "pdf",
        label: "Exportar",
        // 🔴 `supportedFormats` y `endpoint` son UNA sola cosa: el interruptor
        // de la migración al motor declarativo. Van juntos o no va ninguno.
        //
        // `useCrud` elige el botón mirando SÓLO `supportedFormats`: con el
        // array renderea el `DownloadButton` (menú PDF/XLSX/CSV) y le pasa el
        // `endpoint`; sin el array cae al `AsyncExportButton` legacy, que **no
        // recibe `endpoint` como prop**, así que el endpoint no llega nunca.
        supportedFormats: ["pdf", "xlsx", "csv"],
        endpoint: "/v3/invitations", // sin `/api/`: API_BASE_URL ya lo trae.
      },
      extraData: false,
      hideActions: {
        
        add: true,
        edit: true,
        del: true,
      },
      search: true,
      renderView: (props: any) => (
        <RenderView 
          {...props} 
        />
      ),
    };
  }, []);

  // Definición de campos para las invitaciones QR
  const fieldsQR = useMemo(() => {
    return {
      id: { rules: [], api: "e" },

      date_event: {
        rules: [""],
        api: "",
        label: "Fecha",
        list: {
          onRender: (props: any) => {
            return <div>{getDateStrMes(props.item.date_event || "")}</div>;
          },
        },
        filter: {
          label: "Periodo",
          width: "180px",
          options: getPeriodOptions
        }
      },

      owner: {
        rules: [""],
        api: "",
        label: "Residente",
        list: {
          
          onRender: (props: any) => {
            return (
              <div>
                {props.item.owner
                  ? getFullName(props.item.owner)
                  : "Sin residente"}
              </div>
            );
          },
        },
      },

      title: {
        rules: [""],
        api: "",
        label: "Título",
        list: {
          
          onRender: (props: any) => {
            return (
              <div className={styles.invitationTitle}>
                {props.item.title || "Sin título"}
              </div>
            );
          },
        },
      },

      type: {
        rules: [""],
        api: "",
        label: "Tipo",
        filter: {
          label: "Tipo",
          width: "160px",
          options: getTypeOptions,
        },
        list: {
          // Más ancho que los 80px de antes: ahora la celda lleva texto.
          width: "130px",
          onRender: (props: any) => {
            // 🔴 Son TRES tipos, no dos. Medido el 2026-08-08: `I` individual
            // (3.468), `G` grupal (605) y `F` FRECUENTE (999) — las que repiten
            // días de la semana. Acá sólo se preguntaba por `G`, así que las
            // 999 frecuentes se dibujaban con el ícono de individual.
            //
            // El ícono solo no alcanza para distinguir tres cosas, así que va
            // con su nombre al lado. El reporte usa las mismas palabras.
            const type = props.item.type;
            const esGrupal = type === "G";
            const label = INVITATION_TYPE_LABELS[type] ?? INVITATION_TYPE_LABELS.I;

            return (
              <div className={styles.invitationTypeIcon} title={label}>
                {esGrupal ? (
                  <IconGroupsQr className={styles.groupIcon} />
                ) : (
                  <IconSingleQr className={styles.singleIcon} />
                )}
                <span>{label}</span>
              </div>
            );
          },
        },
      },

      status: {
        rules: [""],
        api: "",
        label: "Estado",
        filter: {
          label: "Estado",
          width: "160px",
          options: getStatusOptions,
        },
        list: {
          width: "100px",
          onRender: (props: any) => {
            let statusLabel = "Activa";
            let statusClass = "statusA";

            if (props.item.status === "X") {
              statusLabel = "Anulada";
              statusClass = "statusX";
            } else if (props.item.access && props.item.access.length === 0) {
              statusLabel = "Expirada";
              statusClass = "statusE";
            }

            return (
              <div className={`${styles.statusBadge} ${styles[statusClass]}`}>
                {statusLabel}
              </div>
            );
          },
        },
      },

      guests_count: {
        rules: [""],
        api: "",
        label: "Invitados",
        list: {
          width: "100px",
          onRender: (props: any) => {
            // 🔴 Los invitados viven en DOS lugares según el tipo. Medido el
            // 2026-08-08: de las 3.970 invitaciones con fecha pasada, 3.425 no
            // son grupales, tienen su invitado en `visit_id` y CERO filas en
            // `guests`. Contar sólo `guests` decía "0 invitados" en el 86% de
            // las filas — una invitación individual tiene un invitado.
            const enLaLista = props.item.guests?.length ?? 0;
            const cuantos =
              enLaLista > 0 ? enLaLista : props.item.visit_id ? 1 : 0;

            return <div>{cuantos} invitados</div>;
          },
        },
      },
    };
  }, []);

  // Instancia de useCrud para QR
  const {
    userCan,
    List,
    data,
    reLoad,
    params,
    setParams,
  } = useCrud({
    paramsInitial,
    mod: modQR,
    fields: fieldsQR,
  });

  // Validación de permisos
  const canQR = userCan(modQR.permiso, "R");

  if (!canQR) return <NotAccess />;

  return <List onRowClick={onRowClick} />;
};

export default QRTab;