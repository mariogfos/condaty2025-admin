import useCrud from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import styles from "./Barrios.module.css";
import ItemList from "@/mk/components/ui/ItemList/ItemList";
import useCrudUtils from "../shared/useCrudUtils";
import { useMemo } from "react";
import RenderItem from "../shared/RenderItem";

const mod = {
  modulo: "barrios",
  singular: "barrio",
  plural: "barrios",
  permiso: "barrios",
  extraData: true,
  hideActions: { edit: true, del: true, add: true },
};

const paramsInitial = {
  perPage: 10,
  page: 1,
  fullType: "L",
  searchBy: "",
};

const Barrios = () => {
  const fields = useMemo(
    () => ({
      id: { rules: [], api: "e" },
      dpto_id: {
        rules: ["required"],
        api: "ae",
        label: "Departamento",
        list: { width: "430px" },
        form: { type: "select", optionsExtra: "dptos" },
      },
      mun_id: {
        rules: ["required"],
        api: "ae",
        label: "Municipio",
        list: { width: "400px" },
        form: { type: "select", optionsExtra: "muns" },
      },
      // local_id: {
      //   rules: ["required"],
      //   api: "ae",
      //   label: "Localidad",
      //   list: { width: "400px" },
      //   form: { type: "select", optionsExtra: "locals" },
      // },
      name: {
        rules: ["required"],
        api: "ae",
        label: "Barrio",
        list: true,
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

  const renderItem = (
    item: Record<string, any>,
    i: number,
    onClick: Function
  ) => {
    return (
      <RenderItem item={item} onClick={onClick} onLongPress={onLongPress}>
        <ItemList
          title={item?.name + " - " + item?.code}
          subtitle={
            findOptions(item.dpto_id, extraData?.dptos) +
            " - " +
            findOptions(item.local_id, extraData?.locals)
          }
          variant="V1"
          active={selItem && selItem.id == item.id}
        />
      </RenderItem>
    );
  };

  if (!userCan(mod.permiso, "R")) return <NotAccess />;
  return (
    <div className={styles.roles}>
      <List onTabletRow={renderItem} actionsWidth="300px" />
    </div>
  );
};

export default Barrios;
