"use client";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import styles from "./HomeOwners.module.css";
import { useMemo } from "react";
import RenderItem from "../shared/RenderItem";
import { getFullName } from "@/mk/utils/string";
import useCrudUtils from "../shared/useCrudUtils";

const paramsInitial = {
  perPage: 10,
  page: 1,
  fullType: "L",
  searchBy: "",
};

const HomeOwners = () => {
  const mod: ModCrudType = {
    modulo: "homeowners",
    singular: "Propietario",
    plural: "Propietarios",
    permiso: "",
    extraData: true,
    export: true,
  };

  const fields = useMemo(() => {
    return {
      id: { rules: [], api: "e" },
      ci: {
        rules: ["required"],
        api: "ae",
        label: "Cédula de identidad",
        form: { type: "number" },
        list: { width: "120px" },
      },
      email: {
        rules: ["required"],
        api: "ae",
        label: "Correo electrónico",
        form: {
          type: "text",
        },
        list: {},
      },

      name: {
        rules: ["required"],
        api: "ae",
        label: "Nombre Completo",
        form: {
          type: "text",
          style: { width: "49%" },
          label: "Primer nombre",
        },
        list: {
          onRender: (props: any) => {
            return getFullName(props.item);
          },
        },
      },
      middle_name: {
        rules: [""],
        api: "ae",
        label: "Segundo nombre",
        form: { type: "text", style: { width: "49%" } },
        list: false,
      },
      last_name: {
        rules: [""],
        api: "ae",
        label: "Apellido paterno",
        form: { type: "text", style: { width: "49%" } },
        list: false,
      },
      mother_last_name: {
        rules: [""],
        api: "ae",
        label: "Apellido materno",
        form: { type: "text", style: { width: "49%" } },
        list: false,
      },

      status: {
        rules: [""],
        api: "ae",
        label: "Estado",
        form: {
          type: "select",
          onHide: () => {
            return true;
          },
          options: [
            { id: "A", name: "Activo" },
            { id: "X", name: "Inactivo" },
          ],
        },
        list: { width: "80px" },
      },
    };
  }, []);

  const {
    userCan,
    List,
    setStore,
    onSearch,
    searchs,
    onEdit,
    onDel,
    showToast,
    execute,
    reLoad,
    getExtraData,
  } = useCrud({
    paramsInitial,
    mod,
    fields,
  });
  const { onLongPress, selItem, searchState, setSearchState } = useCrudUtils({
    onSearch,
    searchs,
    setStore,
    mod,
    onEdit,
    onDel,
  });

  if (!userCan(mod.permiso, "R")) return <NotAccess />;
  return (
    <div className={styles.style}>
      <List />
    </div>
  );
};

export default HomeOwners;
