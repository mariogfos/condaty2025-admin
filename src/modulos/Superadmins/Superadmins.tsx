"use client";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import React, { useMemo } from "react";
import useCrudUtils from "../shared/useCrudUtils";
import RenderForm from "./RenderForm/RenderForm";
import { getFullName } from "@/mk/utils/string";
import RenderDel from "./RenderDel/RenderDel";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { getDateTimeStrMes } from "@/mk/utils/date";

const paramsInitial = {
  perPage: 20,
  page: 1,
  fullType: "L",
  searchBy: "",
  type: "FOS",
};

const Superadmins = () => {
  const { user } = useAuth();

  const mod: ModCrudType = {
    modulo: "v3/users",
    singular: "superadmin",
    plural: "superadmins",
    permiso: "superadmins",
    renderDel: (props: any) => <RenderDel {...props} />,
    filter: true,
    extraData: true,
    onHideActions: (item: any) => {
      return {
        hideDel: item.id == user.id,
      };
    },
    hideActions: {
      view: true,
    },
    renderForm: (props: any) => <RenderForm {...props} />,
  };

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
        form: { type: "text", label: "Carnet de identidads`" },
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

      last_connection_at: {
        rules: [""],
        api: "ae",
        label: "Última conexión",
        list: {
          onRender: ({ item }: any) =>
            getDateTimeStrMes(item?.last_connection_at) || "",
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
  return <List height={"100%"} />;
};

export default Superadmins;
