import styles from "./Alerts.module.css";
import RenderItem from "../shared/RenderItem";
import useCrudUtils from "../shared/useCrudUtils";
import { useCallback, useEffect, useMemo, useState } from "react";
import ItemList from "@/mk/components/ui/ItemList/ItemList";
import NotAccess from "@/components/layout/NotAccess/NotAccess";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import {
  IconAlert,
  IconAlert2,
  IconAmbulance,
  IconFlame,
  IconGuardShield,
  IconTheft,
} from "@/components/layout/icons/IconsBiblioteca";
import { WidgetDashCard } from "@/components/Widgets/WidgetsDashboard/WidgetDashCard/WidgetDashCard";
import { getDateTimeStrMesShort } from "@/mk/utils/date";
import { useAuth } from "@/mk/contexts/AuthProvider";
import RenderView from "./RenderView/RenderView";

const paramsInitial = {
  perPage: 20,
  page: 1,
  fullType: "L",
  searchBy: "",
};

const lLevels = [
  { id: "T", name: "Todos" },
  { id: 4, name: "Categoria de panico" },
  { id: 3, name: "Nivel alto" },
  { id: 2, name: "Nivel medio" },
];
export const getAlertLevelText = (level: any) => {
  switch (level) {
    case 4:
      return "Categoria de panico";
    case 3:
      return "Nivel alto";
    case 2:
      return "Nivel medio";
    case 1:
      return "Nivel bajo";
    default:
      return "Nivel medio";
  }
};

const Alerts = () => {
  const mod = {
    modulo: "alerts",
    singular: "alerta",
    plural: "alertas",
    permiso: "",
    extraData: true,
    hideActions: { edit: true, del: true, add: true },
    export: true,
    filter: true,
    renderView: (props: {
      open: boolean;
      onClose: any;
      item: Record<string, any>;
      onConfirm?: Function;
    }) => <RenderView {...props} reLoad={reLoad} />,
  };
  const { setStore } = useAuth();
  useEffect(() => {
    setStore({ title: mod.plural.toUpperCase() });
  }, []);
  const getAlertLevelClass = (level: any) => {
    switch (level) {
      case 4:
        // return styles.nivelPanico;
        return styles.nivelAlto;
      case 3:
        return styles.nivelAlto;
      case 2:
        return styles.nivelMedio;
      case 1:
        return styles.nivelBajo;
      default:
        return styles.nivelMedio;
    }
  };

  const getAlertLevelIcon = (type: any) => {
    switch (type) {
      case "E":
        return <IconAmbulance />;
      case "F":
        return <IconFlame />;
      case "T":
        return <IconTheft />;
      case "O":
        return <IconAlert />;
      default:
        return <IconAlert />;
    }
  };

  const fields = useMemo(
    () => ({
      id: { rules: [], api: "e" },
      guard_id: {
        rules: ["required"],
        api: "ae",
        label: "Informador",
        list: {
          onRender: ({ item }: any) => {
            let entityToDisplay = null;
            let avatarTypePrefix = ""; // "OWNER-" or "GUARD-"
            const isPanic = item?.level === 4;

            // Determinar la entidad a mostrar y el prefijo para el avatar
            if (isPanic) {
              // Para alertas de pánico, priorizar owner, fallback a guardia si owner no está
              if (item.owner) {
                entityToDisplay = item.owner;
                avatarTypePrefix = "OWNER-";
              } else if (item.guardia) {
                // En tu data de ejemplo, guardia es siempre null
                entityToDisplay = item.guardia;
                avatarTypePrefix = "GUARD-";
              }
            } else {
              // Para alertas no pánico, priorizar guardia, fallback a owner
              if (item.guardia) {
                // En tu data de ejemplo, guardia es siempre null
                entityToDisplay = item.guardia;
                avatarTypePrefix = "GUARD-";
              } else if (item.owner) {
                entityToDisplay = item.owner;
                avatarTypePrefix = "OWNER-";
              }
            }
            // Si después de esto entityToDisplay es null, se mostrará "Información no disponible"

            const fullName = entityToDisplay
              ? getFullName(entityToDisplay)
              : "Información no disponible";
            const ci = entityToDisplay?.ci;
            const entityId = entityToDisplay?.id;
            const updatedAt = entityToDisplay?.updated_at;

            const avatarSrc =
              entityId && avatarTypePrefix && updatedAt
                ? getUrlImages(
                    `/${avatarTypePrefix}${entityId}.webp?d=${updatedAt}`
                  )
                : null;

            // Determinar si la entidad mostrada es un guardia para el estilo 'square' del Avatar
            const isGuardBeingDisplayed = !!(
              entityToDisplay &&
              item.guardia &&
              entityToDisplay.id === item.guardia.id &&
              avatarTypePrefix === "GUARD-"
            );

            return (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* Sección del Avatar */}
                {avatarSrc ? (
                  <Avatar
                    src={avatarSrc}
                    name={fullName}
                    
                  />
                ) : (
                  // Avatar de fallback con la inicial del nombre o un "?"
                  <Avatar
                    name={
                      fullName && fullName !== "Información no disponible"
                        ? fullName.substring(0, 1)
                        : "?"
                    }
                    
                  />
                )}

                {/* Sección de Texto e Icono de Pánico */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {/* Mostrar icono específico de alerta (IconAmbulance, IconFlame, etc.) si es pánico y tiene tipo */}
                    {isPanic && item.type && (
                      <span>{getAlertLevelIcon(item.type)}</span>
                    )}
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 500,
                        color: "var(--cWhite, #fafafa)",
                      }}
                    >
                      {fullName}
                    </p>
                  </div>
                  {/* Mostrar CI si está disponible */}
                  {ci && (
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--cWhiteV1, #a7a7a7)",
                        display: "block",
                      }}
                    >
                      CI: {ci}
                    </span>
                  )}
                </div>
              </div>
            );
          },
        },
        form: { type: "text" },
      },
      descrip: {
        rules: ["required"],
        api: "ae",
        label: "Descripción",
        list: true,
        form: { type: "text" },
      },
      created_at: {
        rules: [""],
        api: "",
        label: "Fecha Y Hora de Creacion",
        list: {},
        onRender: (props: any) => {
          return getDateTimeStrMesShort(props.item.created_at);
        },
      },

      level: {
        rules: ["required"],
        api: "ae",
        label: "Nivel de alerta",
        list: {
          onRender: (props: any) => {
            const alertLevel = props?.item?.level || 2;
            const levelClass = `${styles.statusBadge} ${getAlertLevelClass(
              alertLevel
            )}`;

            return (
              <div className={levelClass}>{getAlertLevelText(alertLevel)}</div>
            );
          },
        },
        form: { type: "select", options: lLevels },
        filter: {
          label: "Nivel",
          width: "200px",
          options: () => [...lLevels],
          optionLabel: "name",
          optionValue: "id",
        },
      },
    }),
    []
  );

  const {
    userCan,
    List,
    onSearch,
    searchs,
    onEdit,
    onDel,
    showToast,
    execute,
    reLoad,
    data,
  } = useCrud({
    paramsInitial,
    mod,
    fields,
  });

  if (!userCan(mod.permiso, "R")) return <NotAccess />;
  return (
    <div className={styles.alerts}>
      <div
        style={{
          display: "flex",
          gap: "20px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <WidgetDashCard
          title="Alertas Registradas"
          data={String(data?.extraData?.total_alerts || 0)}
          icon={
            <IconAlert2
              color={"var(--cWhite)"}
              style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
              circle
              size={38}
            />
          }
          // className={styles.widgetResumeCard}
        />
        <WidgetDashCard
          title="Alertas Nivel Bajo"
          data={String(data?.extraData?.low_level || 0)}
          icon={
            <IconAlert2
              color={"var(--cSuccess)"}
              style={{ backgroundColor: "var(--cHoverSuccess)" }}
              circle
              size={38}
            />
          }
          // className={styles.widgetResumeCard}
        />
        <WidgetDashCard
          title="Alertas Nivel Medio"
          data={String(data?.extraData?.medium_level || 0)}
          icon={
            <IconAlert2
              color={"var(--cWarning)"}
              style={{ backgroundColor: "var(--cHoverWarning)" }}
              circle
              size={38}
            />
          }
          // className={styles.widgetResumeCard}
        />
        <WidgetDashCard
          title="Alertas Nivel Alto"
          data={String(data?.extraData?.high_level || 0)}
          icon={
            <IconAlert2
              color={"#da5d5d"}
              style={{ backgroundColor: "var(--errorBg)" }}
              circle
              size={38}
            />
          }
          // className={styles.widgetResumeCard}
        />
        <WidgetDashCard
          title="Categoria de panico"
          data={String(data?.extraData?.emergency_buttons || 0)}
          icon={
            <IconAlert2
              color={"#da5d5d"}
              style={{ backgroundColor: "var(--errorBg)" }}
              circle
              size={38}
            />
          }
          // className={styles.widgetResumeCard}
        />
      </div>
      <List />
    </div>
  );
};

export default Alerts;
