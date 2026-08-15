/* eslint-disable react-hooks/exhaustive-deps */
import React, { useMemo } from "react";
import styles from "../Activities.module.css";
import { getDateStrMes } from "@/mk/utils/date";
import { getFullName } from "@/mk/utils/string";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import { IconGroupsQr, IconSingleQr } from "@/components/layout/icons/IconsBiblioteca";
import RenderView from "./RenderView/RenderView";
import {
  INVITATION_TYPE_LABELS,
  InvitationStatus,
  InvitationType,
  esEstado,
  esTipo,
} from "./invitationEnums";

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
 * ⚠️ Los valores viajan al back en `filterBy` y los interpreta
 * `InvitationController::porEstado()`. Son las palabras que la lista MUESTRA,
 * no los cuatro valores de `invitations.status` —USED, ACTIVE, INACTIVE,
 * CANCELLED— que el usuario no ve por ningún lado: un filtro que hable otro
 * idioma que la columna filtra por algo distinto de lo que se está mirando.
 *
 * 🔴 Por eso este filtro NO cambió con la migración a enums numéricos: nunca
 * mandó el valor de la columna.
 */
const getStatusOptions = () => [
  { id: "ALL", name: "Todos" },
  { id: "ACTIVA", name: "Activa" },
  { id: "EXPIRADA", name: "Expirada" },
  { id: "ANULADA", name: "Anulada" },
];

/**
 * ⚠️ Los ids van como NÚMERO, no como el string que devolvería
 * `Object.entries` —las claves de un objeto son strings siempre, aunque se
 * hayan escrito numéricas—. El back lo tolera porque castea, pero el `Select`
 * compartido compara el id contra el valor del form con `==`, y mezclar `"2"`
 * con `2` en esa comparación es la clase de cosa que después nadie encuentra.
 */
const getTypeOptions = () => [
  { id: "ALL", name: "Todos" },
  ...Object.entries(INVITATION_TYPE_LABELS).map(([id, name]) => ({
    id: Number(id),
    name,
  })),
];
/**
 * 🔴 Los códigos son los CORTOS, y el cambio no es cosmético.
 *
 * Hasta el 2026-08-15 este filtro mandaba `week`/`lweek`/`month`/`lmonth`, y
 * el API los traducía con una tabla propia a los cortos que entiende
 * `PeriodFilterService`. Esa traducción era lo ÚNICO que había dejado al
 * filtro de fechas de Invitaciones afuera de la unificación de 2026-08-04 — y
 * por eso seguía arrastrando los dos bugs que se arreglaron allá: en enero
 * "mes pasado" devolvía cero filas, y parado un día 31 devolvía el mes actual.
 *
 * Con los códigos cortos el listado usa el mismo filtro que los otros 44
 * módulos y la copia desaparece.
 *
 * ⚠️ `t` (Todos) no es un período: el back lo ignora porque no matchea ningún
 * caso, que es exactamente lo que tiene que pasar.
 */
const getPeriodOptions = () => [
  { id: "t", name: "Todos" },
  { id: "w", name: "Esta Semana" },
  { id: "lw", name: "Ant. Semana" },
  { id: "m", name: "Este Mes" },
  { id: "lm", name: "Ant. Mes" }
];

const QRTab: React.FC<QRTabProps> = ({ paramsInitial, onRowClick }) => {
  // Definición del módulo QR
  const modQR: ModCrudType = useMemo(() => {
    return {
      modulo: "v3/invitations",
      singular: "Invitación",
      plural: "Invitaciones QR",
      filter: true,
      // 🔴 Con `permiso: ""` esta lista NO tenía control de acceso:
      // `AuthProvider::userCan` arranca con `if (!ability) return true`, así que
      // cualquier rol que llegara a Actividades veía nombres de residentes,
      // unidades e invitados. Lo detectamos el 2026-08-08 al montar la pestaña.
      //
      // Va `accesses` —el mismo que ya protege la pestaña de al lado y la
      // entrada del menú— porque NO existe un permiso de invitaciones: medido
      // sobre los roles de la base, ninguno de los 40 lo menciona.
      permiso: "accesses",
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
            const type = Number(props.item.type);
            const esGrupal = esTipo(type, InvitationType.GROUP);
            const label =
              INVITATION_TYPE_LABELS[type] ??
              INVITATION_TYPE_LABELS[InvitationType.INDIVIDUAL];

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

            if (esEstado(props.item.status, InvitationStatus.CANCELLED)) {
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