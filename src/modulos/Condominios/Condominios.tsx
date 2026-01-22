"use client";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import React, { useMemo } from "react";
import useCrudUtils from "../shared/useCrudUtils";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import styles from "./Condominios.module.css";
import RenderForm from "./RenderForm/RenderForm";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { getDateTimeStrMes } from "@/mk/utils/date";
import RenderDel from "./RenderDel/RenderDel";

const paramsInitial = {
  perPage: 20,
  page: 1,
  fullType: "L",
  searchBy: "",
};
const mod: ModCrudType = {
  modulo: "clients",
  singular: "condominios",
  plural: "condominios",
  permiso: "condominios",
  renderDel: (props: any) => <RenderDel {...props} />,
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
const statusCondominios: Record<
  string,
  { text: string; bgColor: string; color: string }
> = {
  A: { text: "Activo", bgColor: "#15392B", color: "var(--cAccent)" },
  I: { text: "Inactivo", bgColor: "#3A2121", color: "var(--cError)" },
  // S: { text: "Suspendido", bgColor: "#3B351E", color: "var(--cWarning)" },
};
const privacyCondominios: Record<string, string> = {
  T: "Prueba",
  P: "Público",
};
const Condominios = () => {
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
              backgroundColor={statusCondominios[item?.status]?.bgColor}
              color={statusCondominios[item?.status]?.color}
              style={{ fontSize: "12px" }}
            >
              {statusCondominios[item?.status]?.text || item?.status}
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
            ...Object.keys(statusCondominios).map((key) => ({
              id: key,
              name: statusCondominios[key]?.text || key,
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
            privacyCondominios[item?.privacy] || item?.privacy,
        },
        form: { type: "text" },
        filter: {
          label: "Privacidad",
          width: "280px",
          options: () => [
            { id: "ALL", name: "Todos" },
            ...Object.keys(privacyCondominios).map((key) => ({
              id: key,
              name: privacyCondominios[key] || key,
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

export default Condominios;
