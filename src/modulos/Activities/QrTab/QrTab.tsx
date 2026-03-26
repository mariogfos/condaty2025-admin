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
  onRowClick: (item: any) => void;
}
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
      modulo: "invitations",
      singular: "Invitación",
      plural: "Invitaciones QR",
      filter: true,
      permiso: "",
      export: true,
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
        list: {
          width: "80px",
          onRender: (props: any) => {
            return (
              <div className={styles.invitationTypeIcon}>
                {props.item.type === "G" ? (
                  <IconGroupsQr className={styles.groupIcon} />
                ) : (
                  <IconSingleQr className={styles.singleIcon} />
                )}
              </div>
            );
          },
        },
      },

      status: {
        rules: [""],
        api: "",
        label: "Estado",
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
            return (
              <div>
                {props.item.guests ? props.item.guests.length : 0} invitados
              </div>
            );
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