'use client'
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
// import styles from "./Educations.module.css";
import ItemList from "@/mk/components/ui/ItemList/ItemList";
import useCrudUtils from "../shared/useCrudUtils";
import { useMemo } from "react";
import RenderItem from "../shared/RenderItem";

const mod: ModCrudType = {
  modulo: "abilities",
  singular: "permiso",
  plural: "permisos",
  // import: true,
  // importRequiredCols: "NAME",
  permiso: "",
  extraData: true,
  onHideActions: (item: any) => {
    return {
      hideEdit: item.is_assigned == "1",
      hideDel: item.is_assigned == "1",
    };
  },
};

const RolesAbilities = () => {
  const paramsInitial = {
    perPage: -1,
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
        label: "Código",
        list: true,
        form: { type: "text" },
      },
      client_id: {
        rules: [],
        api: "ae",
        form: false,
        list: false,
      },
      description: {
        rules: [],
        api: "ae",
        label: "Nombre del permiso",
        form: { type: "text" },
        list: true,
      },
      rolcategory_id: {
        label: "Categoría",
        width: "200px",
        options: (extraData: any) => {
          let data: any = [];
          // let data: any = [{ id: "T", name: "Todas" }];
          extraData?.categories?.map((c: any) => {
            data.push({
              id: c.id,
              name: c.name,
            });
          });
          return data;
        },
        form: {
          type: "select",
          optionsExtra: "categories",
          label: "Seleccionar Categoría",
        },
        list: true,
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

export default RolesAbilities;
