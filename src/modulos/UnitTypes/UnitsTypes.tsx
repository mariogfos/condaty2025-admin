"use client";
import useCrud from "@/mk/hooks/useCrud/useCrud";
import RenderForm from "./RenderForm/RenderForm";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import { useEffect, useMemo } from "react";
import { useAuth } from "@/mk/contexts/AuthProvider";
import RenderView from "./RenderView/RenderView";

const mod = {
  modulo: "v3/types",
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
  renderView: (props: any) => <RenderView {...props} />,
  loadView: { fullType: "DET" },
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
          width: "240px",
        },
        form: { type: "text" },
      },
      fields: {
        rules: [""],
        api: "ae",
        label: "Campos extras",
        list: {
          width: "100%",
        },
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
  return <List height={"100%"} />;
};

export default UnitsType;
