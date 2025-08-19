import styles from "./Alerts.module.css";
import useCrudUtils from "../shared/useCrudUtils";
import { useMemo } from "react";
import { StatusBadge } from "@/components/Widgets/StatusBadge/StatusBadge";
import NotAccess from "@/components/layout/NotAccess/NotAccess";
import useCrud from "@/mk/hooks/useCrud/useCrud";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { IconAlert2, IconAlert3 } from "@/components/layout/icons/IconsBiblioteca";
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
  { id: 4, name: "Nivel pánico" },
  { id: 3, name: "Nivel alto" },
  { id: 2, name: "Nivel medio" },
];
export const getAlertLevelText = (level: any) => {
  switch (level) {
    case 4:
      return "Nivel pánico";
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
    plural: "",
    permiso: "alerts",
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
  const getAlertLevelInfo = (level: number) => {
    switch (level) {
      case 4: // Panic (treated as High)
      case 3: // High
        return { 
          label: level === 4 ? 'Nivel pánico' : 'Nivel alto',
          backgroundColor: 'var(--cHoverError)',
          color: 'var(--cError)'
        };
      case 2: // Medium
        return { 
          label: 'Nivel medio',
          backgroundColor: 'var(--cHoverWarning)',
          color: 'var(--cWarning)'
        };
      case 1: // Low
        return { 
          label: 'Nivel bajo',
          backgroundColor: 'var(--cHoverSuccess)',
          color: 'var(--cSuccess)'
        };
      default:
        return { 
          label: 'Nivel desconocido',
          backgroundColor: 'var(--cHoverLight)',
          color: 'var(--cLightDark)'
        };
    }
  };

  const renderGuardInfo = ({ item }: { item: any }) => {
    let entityToDisplay = null;
    let avatarTypePrefix = "";
    const isPanic = item?.level === 4;

    if (isPanic) {
      if (item.owner) {
        entityToDisplay = item.owner;
        avatarTypePrefix = "OWNER-";
      } else if (item.guardia) {
        entityToDisplay = item.guardia;
        avatarTypePrefix = "GUARD-";
      }
    } else if (item.guardia) {
        entityToDisplay = item.guardia;
        avatarTypePrefix = "GUARD-";
      } else if (item.owner) {
        entityToDisplay = item.owner;
        avatarTypePrefix = "OWNER-";
      }

    const fullName = entityToDisplay
      ? getFullName(entityToDisplay)
      : "Información no disponible";
    const ci = entityToDisplay?.ci;
    const entityId = entityToDisplay?.id;
    const updatedAt = entityToDisplay?.updated_at;

    const avatarSrc =
      entityId && avatarTypePrefix && updatedAt
        ? getUrlImages(`/${avatarTypePrefix}${entityId}.webp?d=${updatedAt}`)
        : null;

    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {avatarSrc ? (
          <Avatar
            hasImage={entityToDisplay?.has_image}
            src={avatarSrc}
            name={fullName}
          />
        ) : (
          <Avatar
            name={
              fullName && fullName !== "Información no disponible"
                ? fullName.substring(0, 1)
                : "?"
            }
          />
        )}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <p style={{ margin: 0, fontWeight: 500, color: "var(--cWhite, #fafafa)" }}>
            {fullName}
          </p>
          {ci && (
            <span style={{ fontSize: "11px", color: "var(--cWhiteV1, #a7a7a7)" }}>
              CI: {ci}
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderAlertLevel = ({ item }: { item: any }) => {
    const alertLevel = item?.level || 2;
    const { backgroundColor, color, label } = getAlertLevelInfo(alertLevel);
    
    return (
      <StatusBadge backgroundColor={backgroundColor} color={color}>
        {label}
      </StatusBadge>
    );
  };

  const formatCreatedAt = ({ item }: { item: any }) => {
    return getDateTimeStrMesShort(item.created_at);
  };

  const fields = useMemo(
    () => ({
      id: { rules: [], api: "e" },
      guard_id: {
        rules: ["required"],
        api: "ae",
        label: "Informador",
        list: {
          onRender: renderGuardInfo,
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
        label: "Fecha y hora de creación",
        list: {
          width: "314px",
          onRender: formatCreatedAt,
        },
      },

      level: {
        rules: ["required"],
        api: "ae",
        label: <span style={{display: "block", textAlign: "center", width: "100%"}}>Nivel de alerta</span>,
        list: {
          width: "194px",
          onRender: renderAlertLevel,
        },
        form: { type: "select", options: lLevels },
        filter: {
          label: "Nivel de alerta",
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
    reLoad,
    data,
  } = useCrud({
    paramsInitial,
    mod,
    fields,
  });
  useCrudUtils({
    onSearch,
    searchs,
    setStore,
    mod,
    onEdit,
    onDel,
  });

  if (!userCan(mod.permiso, "R")) return <NotAccess />;
  return (
    <div>
      <h1 className={styles.dashboardTitle}>Alertas</h1>
      <div className={styles.dashboardContainer}>
        <div className={styles.allStatsRow}>
          <WidgetDashCard
            title="Alertas Registradas"
            data={String(data?.extraData?.total_alerts || 0)}
            icon={
              <IconAlert2
                color={
                  !data?.extraData?.total_alerts ||
                  data?.extraData?.total_alerts === 0
                    ? "var(--cWhiteV1)"
                    : "var(--cWhite)"
                }
                style={{
                  backgroundColor:
                    !data?.extraData?.total_alerts ||
                    data?.extraData?.total_alerts === 0
                      ? "var(--cHover)"
                      : "var(--cHoverCompl1)",
                }}
                circle
                size={18}
              />
            }
            className={styles.widgetResumeCard}
          />
          {/* <WidgetDashCard
            title="Alertas Nivel Bajo"
            data={String(data?.extraData?.low_level || 0)}
            icon={
              <IconAlert2
                color={
                  !data?.extraData?.low_level ||
                  data?.extraData?.low_level === 0
                    ? "var(--cWhiteV1)"
                    : "var(--cSuccess)"
                }
                style={{
                  backgroundColor:
                    !data?.extraData?.low_level ||
                    data?.extraData?.low_level === 0
                      ? "var(--cHover)"
                      : "var(--cHoverSuccess)",
                }}
                circle
                size={18}
              />
            }
            className={styles.widgetResumeCard}
            style={{ maxWidth: "300px", width: "100%" }}
          /> */}
          <WidgetDashCard
            title="Alertas Nivel Medio"
            data={String(data?.extraData?.medium_level || 0)}
            icon={
              <IconAlert2
                color={
                  !data?.extraData?.medium_level ||
                  data?.extraData?.medium_level === 0
                    ? "var(--cWhiteV1)"
                    : "var(--cWarning)"
                }
                style={{
                  backgroundColor:
                    !data?.extraData?.medium_level ||
                    data?.extraData?.medium_level === 0
                      ? "var(--cHover)"
                      : "var(--cHoverWarning)",
                }}
                circle
                size={18}
              />
            }
            className={styles.widgetResumeCard}
          />
          <WidgetDashCard
            title="Alertas Nivel Alto"
            data={String(data?.extraData?.high_level || 0)}
            icon={
              <IconAlert2
                color={
                  !data?.extraData?.high_level ||
                  data?.extraData?.high_level === 0
                    ? "var(--cWhiteV1)"
                    : "#da5d5d"
                }
                style={{
                  backgroundColor:
                    !data?.extraData?.high_level ||
                    data?.extraData?.high_level === 0
                      ? "var(--cHover)"
                      : "var(--errorBg)",
                }}
                circle
                size={18}
              />
            }
            className={styles.widgetResumeCard}
          />
          <WidgetDashCard
            title="Categoria de panico"
            data={String(data?.extraData?.emergency_buttons || 0)}
            icon={
              <IconAlert2
                color={
                  !data?.extraData?.emergency_buttons ||
                  data?.extraData?.emergency_buttons === 0
                    ? "var(--cWhiteV1)"
                    : "#da5d5d"
                }
                style={{
                  backgroundColor:
                    !data?.extraData?.emergency_buttons ||
                    data?.extraData?.emergency_buttons === 0
                      ? "var(--cHover)"
                      : "var(--errorBg)",
                }}
                circle
                size={18}
              />
            }
            className={styles.widgetResumeCard}
          />
        </div>
      </div>

      <List
        height={"calc(100vh - 460px)"}
        emptyMsg="No existe ningún tipo de alerta. Cuando un guardia o residente"
        emptyLine2="registre una, se mostrará aquí."
        emptyIcon={<IconAlert3 size={80} color="var(--cWhiteV1)" />}
      />
    </div>
  );
};

export default Alerts;
