'use client'
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import RenderForm from "./RenderForm/RenderForm";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
// import styles from "./Educations.module.css";
import ItemList from "@/mk/components/ui/ItemList/ItemList";
import useCrudUtils from "../shared/useCrudUtils";
import { useMemo } from "react";
import RenderItem from "../shared/RenderItem";

const mod = {
  modulo: "types",
  singular: "Tipo de unidad",
  plural: "Tipos de unidades",
  // import: true,
  // importRequiredCols: "NAME",
  permiso: "",
  extraData: true,
  noWaiting: true,
  renderForm: (props: {
    item: any;
    setItem: any;
    errors: any;
    extraData: any;
    open: boolean;
    onClose: any;
    user: any;
    execute: any;
    setErrors: any;
    action: any;
    reLoad: any;
  }) => {
    return (
      <RenderForm
        {...props}
      />
    );
  },
};
const paramsInitial = {
    perPage: 10,
    page: 1,
    fullType: "L",
    searchBy: "",
  };

const UnitsType = () => {


  const fields = useMemo(() => {
    return {
      id: { rules: [], api: "e" },
      name: {
        rules: ["required"],
        api: "ae",
        label: "Nombre",
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
    <div>
      <List onTabletRow={renderItem} />
    </div>
  );
};

export default UnitsType;
