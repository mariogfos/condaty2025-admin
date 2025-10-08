"use client";
import useCrud from "@/mk/hooks/useCrud/useCrud";
import RenderForm from "./RenderForm/RenderForm";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import { useEffect, useMemo } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import styles from "./UnitsType.module.css";
import { useAuth } from "@/mk/contexts/AuthProvider";

const mod = {
  modulo: "types",
  singular: "Tipo de unidad",
  plural: "Tipos de unidades",
  onHideActions: (item: any) => {
    return {
      hideDel: item.is_fixed == "A",
    };
  },
  permiso: "unittypes",
  extraData: true,
  renderForm: RenderForm,
  renderView: (props: {
    open: boolean;
    onClose: any;
    item: Record<string, any>;
    extraData: any;
  }) => {
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
                    <div
                      key={field.id || `field-${props.item.id}-${index}`}
                      className="pl-4"
                    >
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

const renderExtraFields = (props: any) => {
  const fields = props.item?.fields || [];

  if (!fields || fields.length === 0) {
    return <span>-/-</span>;
  }

  return (
    <span>
      {fields.map((field: any, index: number) => (
        <span key={field.id || `field-${props.item.id}-${index}`}>
          {field.name}
          {index < fields.length - 1 ? ', ' : ''}
        </span>
      ))}
    </span>
  );
};

const UnitsType = () => {
  const fields = useMemo(() => {
    return {
      id: { rules: [], api: "e" },
      name: {
        rules: ["required"],
        api: "ae",
        label: "Nombre",
        list: {
          width: 200,
        },
        form: { type: "text" },
      },
      fields: {
        rules: [""],
        api: "ae",
        label: "Campos extras",
        list: true,
        onRender: renderExtraFields,
      },
    };
  }, []);

  const { setStore, store } = useAuth();
  useEffect(() => {
    setStore({ ...store, title: 'Tipo de unidades' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { userCan, List } = useCrud({
    paramsInitial,
    mod,
    fields,
  });

  if (!userCan(mod.permiso, "R")) return <NotAccess />;
  return (
    <div>
      <List height={"calc(100vh - 350px)"} />
    </div>
  );
};

export default UnitsType;
