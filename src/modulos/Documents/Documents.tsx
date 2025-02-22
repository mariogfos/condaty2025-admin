"use client";
import useCrud from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import styles from "./Documents.module.css";
import ItemList from "@/mk/components/ui/ItemList/ItemList";
import useCrudUtils from "../shared/useCrudUtils";
import { useMemo } from "react";
import RenderItem from "../shared/RenderItem";
import { getFullName } from "@/mk/utils/string";

const mod = {
  modulo: "documents",
  singular: "Documento",
  plural: "Documentos",
  permiso: "",
  extraData: true,
  // hideActions: { edit: true, del: true, add: true },
};

const paramsInitial = {
  perPage: 10,
  page: 1,
  fullType: "L",
  searchBy: "",
};

const options = [
    { id: "O", name: "Residentes" },
    { id: "G", name: "Guardias" },
    { id: "A", name: "Todos" },
  ];

const Documents = () => {
  const fields = useMemo(
    () => ({
      id: { rules: [], api: "e" },
      name: {
        rules: ["required"],
        api: "ae",
        label: "Nombre",
        form: { type: "text" },
        list: { width: "240px" },
      },
      descrip: {
        rules: ["required"],
        api: "ae*",
        label: "Descripción",
        form: { type: "text" },
        list: { width: "100%" },
      },
      for_to: {
        rules: ["required"],
        api: "ae*",
        label: "Destino",
        form: { type: "select", options: options },
        list: { width: "120px" },
      },
      file: {
        rules: ["required"],
        api: "ae*",
        label: "Archivo",
        form: { type: "fileUpload", style: { width: "100%" } },
        
      },
      // ext: {
      //   rules: [""],
      //   // api: ,"ae*"
      //   label: "Extensión",
      //   // form: { type: "text" },
      // },
      position: {
        rules: ["required"],
        api: "ae*",
        label: "Orden",
        form: { type: "text" },
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

export default Documents;
