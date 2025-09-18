import NotAccess from "@/components/auth/NotAccess/NotAccess";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { useAuth } from "@/mk/contexts/AuthProvider";
import useCrud from "@/mk/hooks/useCrud/useCrud";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import React, { useEffect, useMemo, useState } from "react";
import styles from "./Forgiveness.module.css";
import { IconCategories } from "@/components/layout/icons/IconsBiblioteca";
import { getTitular } from "@/mk/utils/adapters";
import { getDateStrMesShort } from "@/mk/utils/date";
import RenderForm from "./RenderForm/RenderForm";
import { formatBs } from "@/mk/utils/numbers";

const mod = {
  modulo: "debt-dptos",
  singular: "condonación",
  plural: "",
  permiso: "defaulters",
  // pagination: false,
  extraData: true,
  export: true,
  hideActions: {
    edit: true,
    del: true,
  },
  titleAdd: "Crear",
  renderForm: RenderForm,
  filter: true,
  saveMsg: {
    add: "Condonación creada con éxito",
    edit: "Condonación actualizada con éxito",
    del: "Condonación eliminada con éxito",
  },
};
const paramsInitial = {
  fullType: "FG",
  page: 1,
  perPage: 20,
  type: 5,
};
const Forgiveness = () => {
  const { setStore, store } = useAuth();
  useEffect(() => {
    setStore({ ...store, title: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const fields = useMemo(
    () => ({
      nro: {
        label: "Unidad",

        form: { type: "text" },
        list: {
          onRender: ({ item }: any) => {
            return item?.dpto?.nro;
          },
        },
      },
      deadline: {
        label: "Fecha de vencimiento",

        form: { type: "date" },
        list: {
          onRender: ({ item }: any) => {
            return getDateStrMesShort(item?.due_at);
          },
        },
      },
      amount: {
        label: "Condonado",
        form: { type: "text" },
        list: {
          onRender: ({ item }: any) => {
            return formatBs(item?.amount);
          },
        },
      },
    }),
    []
  );
  const { userCan, List, data, extraData } = useCrud({
    paramsInitial,
    mod,
    fields,
  });

  if (!userCan(mod.permiso, "R")) return <NotAccess />;
  return (
    <div className={`${styles.Forgiveness}`}>
      <div className={styles.listContainer}>
        <List
          height={"calc(100vh - 490px)"}
          emptyMsg="Lista de morosos vacía. Una vez las cuotas corran, los"
          emptyLine2="residentes con pagos atrasados los verás aquí."
          emptyIcon={<IconCategories size={80} color="var(--cWhiteV1)" />}
          emptyFullScreen={true}
          paginationHide={true}
        />
      </div>
    </div>
  );
};

export default Forgiveness;
