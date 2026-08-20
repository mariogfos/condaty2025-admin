"use client";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import React, { useMemo } from "react";
import useCrudUtils from "../shared/useCrudUtils";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import styles from "./Invitations.module.css";
import { getDateTimeStrMes } from "@/mk/utils/date";
import RenderForm from "./RenderForm/RenderForm";

const paramsInitial = {
  perPage: 20,
  page: 1,
  fullType: "L",
  searchBy: "",
};
const mod: ModCrudType = {
  modulo: "v3/campaigns",
  singular: "campaña",
  plural: "campañas",
  permiso: "campanas",
  titleAdd: "Crear",
  filter: true,
  extraData: true,
  onHideActions: (item: any) => {
    return {
      hideDel: item.clients_count > 0,
    };
  },
  hideActions: {
    view: true,
  },
  renderForm: (props: any) => <RenderForm {...props} />,
};

const Invitations = () => {
  const fields = useMemo(() => {
    return {
      id: { rules: [], api: "ae" },
      name: {
        rules: ["required"],
        api: "ae",
        label: "Nombre",
        list: {
          onRender: ({ item }: any) => {
            return (
              <div className={styles.containerName}>
                <p>{item?.name}</p>
                {item.clients_count > 0 && (
                  <div className={styles.statusBadge}>
                    <p>En uso</p>
                  </div>
                )}
              </div>
            );
          },
        },
        form: { type: "text", label: "Nombre del rol" },
      },
      clients_count: {
        rules: ["required"],
        api: "ae",
        label: "Uso actual",
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
        list: {
          onRender: ({ item }: any) =>
            item?.clients_count +
            (item?.clients_count > 1 ? " Condominios" : " Condominio"),
        },
        form: { type: "text", label: "Código del rol" },
      },
      images_count: {
        rules: [""],
        api: "ae",
        label: "Cantidad",
        list: {
          onRender: ({ item }: any) =>
            item?.images_count + (item?.images_count > 1 ? " Fotos" : " Foto"),
        },
        form: { type: "text" },
      },

      updated_at: {
        rules: [""],
        api: "ae",
        label: "Fecha de subida",
        list: {
          onRender: ({ item }: any) =>
            getDateTimeStrMes(item?.updated_at) || "",
        },
        form: { type: "text" },
      },
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

  if (!userCan(mod.permiso, "R")) return <NotAccess />;
  return <List height={"100%"} />;
};

export default Invitations;
