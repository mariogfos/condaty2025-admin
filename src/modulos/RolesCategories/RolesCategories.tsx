'use client'
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
// import styles from "./Educations.module.css";
import ItemList from "@/mk/components/ui/ItemList/ItemList";
import useCrudUtils from "../shared/useCrudUtils";
import { useMemo } from "react";
import RenderItem from "../shared/RenderItem";

const mod: ModCrudType = {
  modulo: "abilitycategories",
  singular: "Categoría",
  plural: "Categorías",
  // import: true,
  // importRequiredCols:"NAME",
  permiso: "",
  onHideActions: (item: any) => {
    return {
      hideEdit: item.is_assigned == "1",
      hideDel: item.is_assigned == "1",
    };
  },
};

const RolesCategories = () => {


  const paramsInitial = {
    perPage: 10,
    page: 1,
    fullType: "L",
    searchBy: "",
   
  };

  const fields = useMemo(() => {
    return {
      id: { rules: [], api: "e" },
      name: {
        rules: ["required"],
        api: "ae",
        label: "Nombre de Categoría",
        list: true,
        form: { type: "text" },
      },
  
    //   description: {
    //     rules: [],
    //     api: "ae",
    //     label:"Descripción",
    //     form: {type:"text"},
    //     list:true,
    //     default: client_id,
    //   },
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
          title={item?.name}
          subtitle={item?.description}
          variant="V1"
          active={selItem && selItem.id == item.id}
        />
      </RenderItem>
    );
  };

  if (!userCan(mod.permiso, "R")) return <NotAccess />;
  return (
    <div >
      <List onTabletRow={renderItem} />
    </div>
  );
};

export default RolesCategories;
