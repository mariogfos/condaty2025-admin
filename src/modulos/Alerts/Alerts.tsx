import useCrud from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import styles from "./Alerts.module.css";
import { use, useEffect, useMemo } from "react";
import { getFullName } from "@/mk/utils/string";
import { getDateTimeStrMesShort } from "@/mk/utils/date";
import { useAuth } from "@/mk/contexts/AuthProvider";

const mod = {
  modulo: "alerts",
  singular: "alerta",
  plural: "alertas",
  permiso: "",
  extraData: false,
  hideActions: { edit: true, del: true, add: true },
};

const paramsInitial = {
  perPage: 10,
  page: 1,
  fullType: "L",
  searchBy: "",
};

const lLevels = [
  { id: 1, name: "Alto" },
  { id: 2, name: "Medio" },
  { id: 3, name: "Bajo" },
];

const Alerts = () => {
  const { setStore } = useAuth();
  useEffect(() => {
    setStore({ title: mod.plural.toUpperCase() });
  }, []);

  const fields = useMemo(
    () => ({
      id: { rules: [], api: "e" },
      created_at: {
        rules: [""],
        api: "",
        label: "Fecha",
        list: { width: "160px" },
        onRender: (props: any) => {
          return getDateTimeStrMesShort(props.item.created_at);
        },
      },
      level: {
        rules: ["required"],
        api: "ae",
        label: "Nivel de alerta",
        list: { width: "150px" },
        form: { type: "select", options: lLevels },
      },
      descrip: {
        rules: ["required"],
        api: "ae",
        label: "Descripción",
        list: true,
        form: { type: "text" },
      },
      guard_id: {
        rules: ["required"],
        api: "ae",
        label: "Guardia",
        list: { width: "250px" },
        onRender: (props: any) => {
          return getFullName(props.item.guardia);
        },
        form: { type: "text" },
      },
    }),
    []
  );

  const { userCan, List } = useCrud({
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
