"use client";
import useCrud from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import styles from "./Binnacle.module.css";
import ItemList from "@/mk/components/ui/ItemList/ItemList";
import useCrudUtils from "../shared/useCrudUtils";
import { useMemo } from "react";
import RenderItem from "../shared/RenderItem";
import { getFullName } from "@/mk/utils/string";

const mod = {
  modulo: "guardnews",
  singular: "Bitácora",
  plural: "Bitácoras",
  permiso: "",
  extraData: true,
  hideActions: { edit: true, del: true, add: true },
};

const paramsInitial = {
  perPage: 10,
  page: 1,
  fullType: "L",
  searchBy: "",
};


const Binnacle = () => {
  const fields = useMemo(
    () => ({
      id: { rules: [], api: "e" },
      descrip: {
        rules: ["required"],
        api: "ae",
        label: "Descripción",
        form: { type: "text" },
        list: { },
      },
      guardia: {
        rules: [""],
        api: "",
        label: "Guardia",
        list: {
            onRender: (props: any) => {
            return getFullName(props.item.guardia); }}
      },
      status: {
        rules: [""],
        api: "ae",
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

export default Binnacle;
