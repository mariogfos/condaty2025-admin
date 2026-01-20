"use client";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import { useAuth } from "@/mk/contexts/AuthProvider";
import React, { useMemo } from "react";
import useCrudUtils from "../shared/useCrudUtils";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import RenderItem from "../shared/RenderItem";
import ItemList from "@/mk/components/ui/ItemList/ItemList";
import styles from "./Condominios.module.css";
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
  onHideActions: (item: any) => {
    return {
      hideEdit: item.is_fixed == "1",

      hideDel: item.is_fixed == "1" || item.is_assigned == "1",
    };
  },
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
      privacidad: {
        rules: [""],
        api: "ae",
        label: "Descripción",
        list: true,
        form: { type: "text" },
      },

      // area_id:{
      //   rules: [],
      //   api: "ae",
      //   label: "Áreas",
      //   list: {
      //     onRender:(props:any)=>{
      //       // console.log(props.extraData.role_categories[props.item.rolecategory_id].name,'propsssssdasdadds')
      //       return props.extraData.role_categories[props.item.rolecategory_id].name
      //     }
      //   },
      //   form: {
      //          type: "select",
      //          optionsExtra: "role_categories",
      //        },

      //   },
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
  const renderItem = (
    item: Record<string, any>,
    i: number,
    onClick: Function,
  ) => {
    return (
      <RenderItem item={item} onClick={onClick} onLongPress={onLongPress}>
        {/* <ItemList
          title={item?.description}
          subtitle={
            "Cod: " +
            item?.name +
            " - Nivel: " +
            levelRender({ value: item?.level })
          }
          variant="V1"
          active={selItem && selItem.id == item.id}
        /> */}
        <></>
      </RenderItem>
    );
  };
  if (!userCan(mod.permiso, "R")) return <NotAccess />;
  return (
    <div className={styles.Roles}>
      <List onTabletRow={renderItem} actionsWidth="300px" />
    </div>
  );
};

export default Condominios;
