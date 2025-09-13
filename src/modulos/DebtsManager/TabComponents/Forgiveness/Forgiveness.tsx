import NotAccess from "@/components/auth/NotAccess/NotAccess";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { useAuth } from "@/mk/contexts/AuthProvider";
import useCrud from "@/mk/hooks/useCrud/useCrud";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import React, { useEffect, useMemo, useState } from "react";
import styles from "./Forgiveness.module.css";
import { IconCategories } from "@/components/layout/icons/IconsBiblioteca";
import { getTitular } from "@/mk/utils/adapters";

const mod = {
  modulo: "defaulters",
  singular: "Moroso",
  plural: "Morosos",
  permiso: "defaulters",
  pagination: false,
  extraData: true,
  export: true,
  hideActions: {
    view: true,
    add: true,
    edit: true,
    del: true,
  },
  filter: true,
  saveMsg: {
    add: "Moroso creado con éxito",
    edit: "Moroso actualizado con éxito",
    del: "Moroso eliminado con éxito",
  },
};
const Forgiveness = () => {
  const paramsInitial = {
    fullType: "L",
    page: 1,
    perPage: -1,
  };
  const { setStore, store } = useAuth();
  useEffect(() => {
    setStore({ ...store, title: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const fields = useMemo(
    () => ({
      dpto: {
        rules: [],
        api: "ae",
        label: "Unidad",
        width: "170px",
        list: {
          width: "83px",
        },
      },
      titular: {
        rules: [],
        api: "ae",
        label: "Titular",
        list: {
          onRender: (props: { item: any }) => {
            const titular = getTitular(props.item);
            const titularId = titular?.id;

            return (
              <div>
                {titular ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <Avatar
                      hasImage={titular?.has_image}
                      src={
                        titularId
                          ? getUrlImages(
                              "/OWNER" +
                                "-" +
                                titularId +
                                ".webp" +
                                (titular?.updated_at
                                  ? "?d=" + titular?.updated_at
                                  : "")
                            )
                          : ""
                      }
                      name={getFullName(titular)}
                      w={32}
                      h={32}
                    />
                    {getFullName(titular)}
                  </div>
                ) : (
                  " Sin titular"
                )}
              </div>
            );
          },
        },
      },
      count: {
        rules: [],
        api: "ae",
        label: "Expensas atrasadas",
        width: "115px",
        list: {
          onRender: (props: { item: { count: number } }) => {
            const s = props?.item?.count > 1 ? "s" : "";
            return props?.item?.count + " expensa" + s;
          },
        },
      },
      //   expensa: {
      //     rules: [],
      //     api: "ae",
      //     label: (
      //       <span
      //         style={{ display: "block", textAlign: "right", width: "100%" }}
      //         title="Total de expensas"
      //       >
      //         Expensas
      //       </span>
      //     ),
      //     list: {
      //       onRender: (props: { item: { expensa: number } }) => (
      //         <FormatBsAlign value={props?.item?.expensa} alignRight />
      //       ),
      //     },
      //   },
      //   multa: {
      //     rules: [],
      //     api: "ae",
      //     label: (
      //       <span
      //         style={{ display: "block", textAlign: "right", width: "100%" }}
      //         title="Total de multas"
      //       >
      //         Multas
      //       </span>
      //     ),
      //     list: {
      //       onRender: (props: { item: { multa: number } }) => (
      //         <FormatBsAlign value={props?.item?.multa} alignRight />
      //       ),
      //     },
      //   },

      //   total: {
      //     rules: [],
      //     api: "ae",
      //     label: (
      //       <span
      //         style={{ display: "block", textAlign: "right", width: "100%" }}
      //         title="Monto total"
      //       >
      //         Total
      //       </span>
      //     ),
      //     list: {
      //       onRender: (props: { item: { expensa: number; multa: number } }) => (
      //         <FormatBsAlign
      //           value={props?.item?.expensa + props?.item?.multa}
      //           alignRight
      //         />
      //       ),
      //     },
      //   },
    }),
    []
  );
  const { userCan, List, data, extraData } = useCrud({
    paramsInitial,
    mod,
    fields,
  });

  const [defaultersLength, setDefaultersLength] = useState(0);

  useEffect(() => {
    if (data?.data) {
      setDefaultersLength(data.data.length ?? 0);
    }
  }, [data]);

  interface Totals {
    porCobrarExpensa: number;
    porCobrarMulta: number;
  }

  const calculatedTotals = useMemo(() => {
    if (!data?.data || data.data.length === 0) {
      return { porCobrarExpensa: 0, porCobrarMulta: 0 };
    }
    const totals = data.data.reduce(
      (acc: Totals, item: { expensa: number; multa: number }) => {
        acc.porCobrarExpensa += item.expensa || 0;
        acc.porCobrarMulta += item.multa || 0;
        return acc;
      },
      { porCobrarExpensa: 0, porCobrarMulta: 0 }
    );
    return totals;
  }, [data?.data]);
  const finalTotals = useMemo(
    () => ({
      porCobrarExpensa:
        extraData?.porCobrarExpensa || calculatedTotals.porCobrarExpensa,
      porCobrarMulta:
        extraData?.porCobrarMulta || calculatedTotals.porCobrarMulta,
    }),
    [
      extraData?.porCobrarExpensa,
      extraData?.porCobrarMulta,
      calculatedTotals.porCobrarExpensa,
      calculatedTotals.porCobrarMulta,
    ]
  );

  if (!userCan(mod.permiso, "R")) return <NotAccess />;
  return (
    <div className={`${styles.Forgiveness}`}>
      <h1 className={styles.title}>Morosos</h1>
      <div className={styles.listContainer}>
        <List
          height={"calc(100vh - 390px)"}
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
