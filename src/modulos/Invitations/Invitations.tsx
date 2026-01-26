"use client";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import React, { useMemo } from "react";
import useCrudUtils from "../shared/useCrudUtils";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import styles from "./Invitations.module.css";
// import RenderForm from "./RenderForm/RenderForm";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { getDateTimeStrMes } from "@/mk/utils/date";
// import RenderDel from "./RenderDel/RenderDel";

const paramsInitial = {
  perPage: 20,
  page: 1,
  fullType: "L",
  searchBy: "",
};
const mod: ModCrudType = {
  modulo: "clients",
  singular: "campaña",
  plural: "campañas",
  permiso: "condominios",
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
  // renderForm: (props: any) => <RenderForm {...props} />,
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
const Invitations = () => {
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
      current_use: {
        rules: ["required"],
        api: "ae",
        label: "Uso actual",
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
        list: {
          // ,
        },
        form: { type: "text", label: "Código del rol" },
      },
      amount: {
        rules: [""],
        api: "ae",
        label: "Cantidad",
        list: {},
        form: { type: "text" },
      },

      upload_date: {
        rules: [""],
        api: "ae",
        label: "Fecha de subida",
        list: {
          onRender: ({ item }: any) =>
            getDateTimeStrMes(item?.upload_date) || "",
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

export default Invitations;
