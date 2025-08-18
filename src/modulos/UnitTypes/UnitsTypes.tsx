"use client";
import useCrud from "@/mk/hooks/useCrud/useCrud";
import RenderForm from "./RenderForm/RenderForm";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import ItemList from "@/mk/components/ui/ItemList/ItemList";
import useCrudUtils from "../shared/useCrudUtils";
import { useMemo } from "react";
import RenderItem from "../shared/RenderItem";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import styles from "./UnitsType.module.css";

const mod = {
  modulo: "types",
  singular: "Tipo de unidad",
  plural: "Tipos de unidades",
  onHideActions: (item: any) => {
    return {
      hideDel: item.is_fixed == "A",
    };
  },
  permiso: "",
  extraData: true,
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
    return <RenderForm {...props} />;
  },
  renderView: (props: {
    open: boolean;
    onClose: any;
    item: Record<string, any>;
    extraData: any;
  }) => {
    console.log(props, "props renderview");
    return (
      <DataModal
        open={props.open}
        onClose={props.onClose}
        title={"Detalle de tipo de unidad"}
        buttonText=""
        buttonCancel=""
      >
        <div className={styles.renderView}>
          <div>
            <div>
              <span className="font-medium">Tipo de unidad: </span>
              <span className="text-lg font-semibold mb-4">
                {props.item?.name}
              </span>
            </div>
          </div>

          <div>
            <div>
              <span className="font-medium">Descripción: </span>
              <span>{props.item?.description || "Sin descripción"}</span>
            </div>
            <div>
              <span className="font-medium">Campos:</span>
              <div className="mt-2 space-y-2">
                {props?.extraData?.fields
                  ?.filter((field: any) => field.type_id === props.item.id)
                  .map((field: any, index: number) => (
                    <div key={index} className="pl-4">
                      {/* // esto?? index debe ser combinado o usar un id, no solo index como key */}
                      <span style={{ color: "var(--cWhite)" }}>
                        {field.name}
                      </span>
                      {field.description}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </DataModal>
    );
  },
};
const paramsInitial = {
  perPage: 20,
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
      fields: {
        rules: [""],
        api: "ae",
        label: "Campos extras",
        list: true,
        onRender: (props: any) => {
          // esto?  puede ser una funcion
          const fieldsForThisType = props?.extraData?.fields?.filter(
            (field: any) => field.type_id === props.item.id
          );

          if (!fieldsForThisType || fieldsForThisType.length === 0) {
            return <span>Sin campos extras</span>;
          }

          const fieldNames = fieldsForThisType.map((field: any) => field.name);
          return <span>{fieldNames.join(", ")}</span>;
        },
      },
    };
  }, []);

  const { userCan, List, setStore, onSearch, searchs, onEdit, onDel, loaded } =
    useCrud({
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
          title={item?.name}
          subtitle={item?.description}
          variant="V1"
          active={selItem && selItem.id == item.id}
        />
      </RenderItem>
    );
  };
  console.log(loaded, "loaded");

  if (!userCan(mod.permiso, "R")) return <NotAccess />;
  return (
    <div>
      <List onTabletRow={renderItem} height={"calc(100vh - 405px)"} />
    </div>
  );
};

export default UnitsType;
