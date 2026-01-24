"use client";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import { getDateTimeStrMes } from "@/mk/utils/date";
import React, { useMemo } from "react";
import useCrudUtils from "../shared/useCrudUtils";
import styles from "./Superadmins.module.css";
import RenderForm from "./RenderForm/RenderForm";

const paramsInitial = {
  perPage: 20,
  page: 1,
  fullType: "L",
  searchBy: "",
};
const mod: ModCrudType = {
  modulo: "clients",
  singular: "superadmin",
  plural: "superadmins",
  permiso: "superadmins",
  // renderDel: (props: any) => <RenderDel {...props} />,
  filter: true,
  extraData: true,
  onHideActions: (item: any) => {
    return {
      hideDel: item.privacy == "P" || item.status == "I",
    };
  },
  hideActions: {
    view: true,
  },
  renderForm: (props: any) => <RenderForm {...props} />,
};
const statusSuperadmins: Record<
  string,
  { text: string; bgColor: string; color: string }
> = {
  A: { text: "Activo", bgColor: "#15392B", color: "var(--cAccent)" },
  I: { text: "Inactivo", bgColor: "#3A2121", color: "var(--cError)" },
  // S: { text: "Suspendido", bgColor: "#3B351E", color: "var(--cWarning)" },
};
const privacySuperadmins: Record<string, string> = {
  T: "Prueba",
  P: "Público",
};
const Superadmins = () => {
  const fields = useMemo(() => {
    return {
      id: { rules: [], api: "ae" },
      name: {
        rules: ["required"],
        api: "ae",
        label: "Nombre",
        list: {},
        form: { type: "text", label: "Nombre del rol" },
        hide: true,
      },
      status: {
        rules: ["required"],
        api: "ae",
        label: "Estado",
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
        list: {
          onRender: ({ item }: any) => (
            <StatusBadge
              backgroundColor={statusSuperadmins[item?.status]?.bgColor}
              color={statusSuperadmins[item?.status]?.color}
              style={{ fontSize: "12px" }}
            >
              {statusSuperadmins[item?.status]?.text || item?.status}
            </StatusBadge>
          ),
          // ,
        },
        form: { type: "text", label: "Código del rol" },
        filter: {
          label: "Filtrar por estado",
          width: "180px",
          options: () => [
            { id: "ALL", name: "Todos" },
            ...Object.keys(statusSuperadmins).map((key) => ({
              id: key,
              name: statusSuperadmins[key]?.text || key,
            })),
          ],
        },
      },
      privacy: {
        rules: [""],
        api: "ae",
        label: "Privacidad",
        list: {
          onRender: ({ item }: any) =>
            privacySuperadmins[item?.privacy] || item?.privacy,
        },
        form: { type: "text" },
        filter: {
          label: "Privacidad",
          width: "280px",
          options: () => [
            { id: "ALL", name: "Todos" },
            ...Object.keys(privacySuperadmins).map((key) => ({
              id: key,
              name: privacySuperadmins[key] || key,
            })),
          ],
        },
      },

      created_at: {
        rules: [""],
        api: "ae",
        label: "Creado el",
        list: {
          onRender: ({ item }: any) =>
            getDateTimeStrMes(item?.created_at) || "",
        },
        form: { type: "text" },
      },
      updated_at: {
        rules: [""],
        api: "ae",
        label: "Actualizado el",
        list: {
          onRender: ({ item }: any) =>
            getDateTimeStrMes(item?.updated_at) || "",
        },
        form: { type: "text" },
      },
    };
  }, []);
  const { userCan, List, setStore, onSearch, searchs, onEdit, onDel } = useCrud(
    {
      paramsInitial,
      mod,
      fields,
    },
  );
  const { onLongPress, selItem } = useCrudUtils({
    onSearch,
    searchs,
    setStore,
    mod,
    onEdit,
    onDel,
  });

  if (!userCan(mod.permiso, "R")) return <NotAccess />;
  return (
    <div className={styles.Roles}>
      <List height={"calc(100vh - 360px)"} />
    </div>
  );
};

export default Superadmins;
