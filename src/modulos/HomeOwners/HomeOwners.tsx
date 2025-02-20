"use client";
import useCrud from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import styles from "./HomeOwners.module.css";
import ItemList from "@/mk/components/ui/ItemList/ItemList";
import useCrudUtils from "../shared/useCrudUtils";
import { useMemo } from "react";
import RenderItem from "../shared/RenderItem";

const mod = {
  modulo: "homeowners",
  singular: "Propietario",
  plural: "Propietarios",
  permiso: "homeowners",
  extraData: true,
  // hideActions: { edit: true, del: true, add: true },
};

const paramsInitial = {
  perPage: 10,
  page: 1,
  fullType: "L",
  searchBy: "",
};

// 'name',
//     'middle_name',
//     'last_name',
//     'mother_last_name',
//     'ci',
//     'phone',
//     'email',
//     'password',
//     'url_avatar',
//     'type',
//     'status',
const HomeOwners = () => {
  const fields = useMemo(
    () => ({
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
          // onBlur: (e: any, { item, setItem, error, setError }: any) =>
          //   _onBlur(e, item, setItem, error, setError),
        },
        list: { width: "160px" },
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
          onRender: (item: any) => item.name + " " + item.last_name,
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
        rules: ["required"],
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
    }),
    []
  );

  const {
    userCan,
    List,
    setStore,
    onSearch,
    searchs,
    onEdit,
    onDel,
    extraData,
    findOptions,
  } = useCrud({
    paramsInitial,
    mod,
    fields,
  });
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
    <div className={styles.style}>
      <List />
    </div>
  );
};

export default HomeOwners;
