"use client";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import { getDateTimeStrMes } from "@/mk/utils/date";
import React, { useMemo } from "react";
import useCrudUtils from "../shared/useCrudUtils";
import styles from "./Superadmins.module.css";
import RenderForm from "./RenderForm/RenderForm";
import { getFullName } from "@/mk/utils/string";

const paramsInitial = {
  perPage: 20,
  page: 1,
  fullType: "L",
  searchBy: "",
  type: "FOS",
};
const mod: ModCrudType = {
  modulo: "users",
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
        list: {
          onRender: ({ item }: any) => (
            <p style={{ color: "var(--cWhite)", fontWeight: "500" }}>
              {getFullName(item)}
            </p>
          ),
        },
        form: { type: "text" },
      },
      last_name: {
        rules: ["required"],
        api: "ae",
        label: "Apellido",
        list: false,
        form: { type: "text" },
      },
      middle_name: {
        rules: ["alpha"],
        api: "ae",
        label: "Segundo nombre",
        list: false,
        form: { type: "text" },
      },
      mother_last_name: {
        rules: ["alpha"],
        api: "ae",
        label: "Apellido de la madre",
        list: false,
        form: { type: "text" },
      },
      phone: {
        rules: ["required"],
        api: "ae",
        label: "Celular",
        list: false,
        form: { type: "text" },
      },
      email: {
        rules: ["required", "email"],
        api: "ae",
        label: "Email",
        list: false,
        form: { type: "text" },
      },
      ci: {
        rules: ["required"],
        api: "ae",
        label: "Carnet",
        list: {},
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
      devices_count: {
        rules: [""],
        api: "ae",
        label: "Dispositivos",
        list: {
          onRender: ({ item }: any) => item?.devices_count + " Dispositivos",
        },
        form: false,
      },

      // last_login_at: {
      //   rules: [""],
      //   api: "ae",
      //   label: "Última conexión",
      //   list: {
      //     onRender: ({ item }: any) =>
      //       getDateTimeStrMes(item?.last_login_at) || "",
      //   },
      //   form: { type: "text" },
      // },
      // updated_at: {
      //   rules: [""],
      //   api: "ae",
      //   label: "Actualizado el",
      //   list: {
      //     onRender: ({ item }: any) =>
      //       getDateTimeStrMes(item?.updated_at) || "",
      //   },
      //   form: { type: "text" },
      // },
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
