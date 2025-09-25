import NotAccess from "@/components/auth/NotAccess/NotAccess";
import { useAuth } from "@/mk/contexts/AuthProvider";
import useCrud from "@/mk/hooks/useCrud/useCrud";
import { getFullName } from "@/mk/utils/string";
import React, { useEffect, useMemo } from "react";
import styles from "./Forgiveness.module.css";
import { IconCategories } from "@/components/layout/icons/IconsBiblioteca";
import { getDateStrMesShort } from "@/mk/utils/date";
import RenderForm from "./RenderForm/RenderForm";
import { formatBs } from "@/mk/utils/numbers";
import {
  colorStatusForgiveness,
  statusForgiveness,
  statusForgivenessFilter,
} from "./constans";
import RenderView from "./RenderView/RenderView";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";

const paramsInitial = {
  fullType: "FG",
  page: 1,
  perPage: -1,
  type: 5,
};
const Forgiveness = () => {
  const onEdit = (item: any) => {
    let day = new Date().toISOString().split("T")[0];
    // console.log(item?.due_at, day);
    if (item?.due_at >= day && item?.status !== "P") {
      return false;
    }
    return true;
  };
  const mod = {
    modulo: "debt-dptos",
    singular: "condonación",
    plural: "",
    permiso: "defaulters",
    sumarize: true,
    extraData: true,
    loadView: { fullType: "DET", type: 5 },
    export: true,
    onHideActions: (item: any) => {
      return {
        hideEdit: onEdit(item),

        hideDel: true,
      };
    },
    titleAdd: "Crear",
    renderForm: RenderForm,
    renderView: RenderView,
    filter: true,
    saveMsg: {
      add: "Condonación creada con éxito",
      edit: "Condonación actualizada con éxito",
      del: "Condonación eliminada con éxito",
    },
  };
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
      titular: {
        label: "Titular",
        form: { type: "text" },
        list: {
          onRender: ({ item }: any) => {
            let titular =
              item?.dpto?.holder == "H"
                ? item?.dpto?.homeowner
                : item?.dpto?.tenant;
            return getFullName(titular);
          },
        },
      },
      due_at: {
        label: "Vencimiento",

        form: { type: "date" },
        list: {
          onRender: ({ item }: any) => {
            return getDateStrMesShort(item?.due_at);
          },
        },
      },
      status: {
        label: (
          <span
            style={{ display: "block", width: "100%", textAlign: "center" }}
          >
            Estado
          </span>
        ),
        form: { type: "text" },
        list: {
          onRender: ({ item }: any) => {
            let status = item?.status;
            if (item?.due_at < new Date().toISOString().split("T")[0]) {
              status = "M";
            }
            return (
              <StatusBadge
                color={colorStatusForgiveness[item?.status]?.color}
                backgroundColor={colorStatusForgiveness[item?.status]?.bg}
              >
                {statusForgiveness[item?.status]}
              </StatusBadge>
            );
          },
        },
        // filter: {
        //   label: "Estado",
        //   options: () => statusForgivenessFilter,
        // },
      },
      category: {
        label: "Categoría",
        form: { type: "text" },
        list: {
          onRender: ({ item }: any) => {
            return item?.subcategory?.padre?.name;
          },
        },
      },
      total_amount: {
        label: "Deuda total",
        form: { type: "text" },
        list: {
          onRender: ({ item }: any) => {
            return formatBs(
              Number(item?.forgiveness_amount) + Number(item?.amount)
            );
          },
        },
      },

      forgiveness_amount: {
        sumarize: true,
        label: "Condonado",
        form: { type: "text" },
        list: {
          onRender: ({ item }: any) => {
            return formatBs(item?.forgiveness_amount);
          },
        },
      },
      amount: {
        label: "Total a cobrar",
        form: { type: "text" },
        sumarize: true,
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
