'use client'
/* eslint-disable react-hooks/exhaustive-deps */
import useCrud, {
  ModCrudType,
  TypeRenderForm,
} from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import styles from "./Roles.module.css";
import ItemList from "@/mk/components/ui/ItemList/ItemList";
import { RenderColType } from "@/mk/components/ui/Table/Table";
import useCrudUtils from "../shared/useCrudUtils";
import { useEffect, useMemo } from "react";
import { useAuth } from "@/mk/contexts/AuthProvider";
import RenderItem from "../shared/RenderItem";
import Permisos from "./Permisos";

const lLevel = ["Fos", "Partido", "Provincia", "Canton", "Parroquia", "Barrio"];

const mod: ModCrudType = {
  modulo: "roles",
  singular: "rol",
  plural: "roles",
  permiso: "",
  extraData: true,
  onHideActions: (item: any) => {
    return {
      hideEdit: item.is_fixed == "1",

      hideDel: item.is_fixed == "1" || item.is_assigned == "1",
    };
  },
};

const levelRender = (item: RenderColType) => {
  return lLevel[item.value];
  //Level ender
};

const arrayToSelect = (array: string[], level: number = 6) => {
  const arr: any = [];
  array.map((item, i) => {
    if (level <= i) arr.push({ id: i, name: item });
  });
  return arr;
};

const paramsInitial = {
  perPage: -1,
  page: 1,
  fullType: "L",
  searchBy: "",
};

const Roles = () => {
  const { user } = useAuth();

  const renderPermisos = ({
    field,
    item,
    setItem,
    onChange,
    error,
    extraData,
  }: TypeRenderForm) => {
    console.log("renderPermisos", extraData);
    return (
      <Permisos
        data={item}
        options={extraData?.abilities || [{ id: 1, name: "CRUD" }]}
        setItem={setItem}
        error={error}
      />
    );
  };

  const fields = useMemo(() => {
    return {
      id: { rules: [], api: "ae" },
      name: {
        rules: ["required"],
        api: "ae",
        label: "Rol",
        list: { width: "250" },
        form: { type: "text", label: "Nombre del rol" },
        hide: true,
      },
      description: {
        rules: [""],
        api: "ae",
        label: "Descripción",
        list: true,
        form: { type: "text" },
      },


      area_id:{
        rules: [],
        api: "ae",
        label: "Áreas",
        list: {
          onRender:(props:any)=>{
            // console.log(props.extraData.role_categories[props.item.rolecategory_id].name,'propsssssdasdadds')
            return props.extraData.role_categories[props.item.rolecategory_id].name
          }
        },
        form: {
               type: "select",
               optionsExtra: "role_categories",               
             },
 
        },
      abilities: {
        rules: [],
        api: "ae",
        label: "Habilidades",
        list: false,
        form: { onRender: renderPermisos },
        onRenderView: renderPermisos,
      },
    };
  }, []);

  const { userCan, List, setStore, onSearch, searchs, onEdit, onDel } = useCrud(
    {
      paramsInitial,
      mod,
      fields,
    }
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
    onClick: Function
  ) => {
    return (
      <RenderItem item={item} onClick={onClick} onLongPress={onLongPress}>
        <ItemList
          title={item?.description}
          subtitle={
            "Cod: " +
            item?.name +
            " - Nivel: " +
            levelRender({ value: item?.level })
          }
          variant="V1"
          active={selItem && selItem.id == item.id}
        />
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

export default Roles;
