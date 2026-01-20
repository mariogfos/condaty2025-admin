"use client";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import { useAuth } from "@/mk/contexts/AuthProvider";
import React, { useMemo } from "react";
import useCrudUtils from "../shared/useCrudUtils";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import RenderItem from "../shared/RenderItem";
import ItemList from "@/mk/components/ui/ItemList/ItemList";
import styles from "./Condominios.module.css";
import RenderForm from "./RenderForm/RenderForm";
const paramsInitial = {
  perPage: 20,
  page: 1,
  fullType: "L",
  searchBy: "",
};
const mod: ModCrudType = {
  modulo: "roles",
  singular: "condominios",
  plural: "condominios",
  permiso: "owner",
  extraData: true,
  // onHideActions: (item: any) => {
  //   return {
  //     hideEdit: item.is_fixed == "1",

  //     hideDel: item.is_fixed == "1" || item.is_assigned == "1",
  //   };
  // },
  hideActions: {
    view: true,
  },
  renderForm: (props: any) => <RenderForm {...props} />,
};
const Condominios = () => {
  const fields = useMemo(() => {
    return {
      id: { rules: [], api: "ae" },
      name: {
        rules: ["required"],
        api: "ae",
        label: "Nombre",
        list: { width: "250" },
        form: { type: "text", label: "Nombre del rol" },
        hide: true,
      },
      status: {
        rules: ["required"],
        api: "ae",
        label: "Estado",
        list: { width: "250" },
        form: { type: "text", label: "Código del rol" },
        hide: true,
      },
      privacy: {
        rules: [""],
        api: "ae",
        label: "Privacidad",
        list: true,
        form: { type: "text" },
      },

      created_at: {
        rules: [""],
        api: "ae",
        label: "Creado el",
        list: true,
        form: { type: "text" },
      },
      updated_at: {
        rules: [""],
        api: "ae",
        label: "Actualizado el",
        list: true,
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
      <List />
    </div>
  );
};

export default Condominios;
