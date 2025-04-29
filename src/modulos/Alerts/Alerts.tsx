import useCrud from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import styles from "./Alerts.module.css";
import { useEffect, useMemo } from "react";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { getDateTimeStrMesShort } from "@/mk/utils/date";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import RenderView from "./RenderView/RenderView";
import {
  IconAlert,
  IconAmbulance,
  IconFlame,
  IconTheft,
} from "@/components/layout/icons/IconsBiblioteca";

const paramsInitial = {
  perPage: 20,
  page: 1,
  fullType: "L",
  searchBy: "",
};

const lLevels = [
  { id: "T", name: "Todos" },
  { id: 3, name: "Nivel alto" },
  { id: 2, name: "Nivel medio" },
];
export const getAlertLevelText = (level: any) => {
  switch (level) {
    case 4:
      return "Nivel panico";
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
    extraData: false,
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
        return styles.nivelPanico;
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
            return (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {item?.level == 4 ? (
                  getAlertLevelIcon(item?.type)
                ) : (
                  <Avatar
                    src={getUrlImages(
                      "/GUARD-" +
                        item?.guardia?.id +
                        ".webp?d=" +
                        item?.guardia?.updated_at
                    )}
                    name={getFullName(item.guardia)}
                    square
                  />
                )}
                <div>
                  <p>
                    {getFullName(item?.level == 4 ? item?.owner : item.guardia)}{" "}
                  </p>
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
        label: "Fecha",
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

  const { userCan, List, reLoad } = useCrud({
    paramsInitial,
    mod,
    fields,
  });

  if (!userCan(mod.permiso, "R")) return <NotAccess />;
  return (
    <div className={styles.style}>
      <List />
    </div>
  );
};

export default Alerts;
