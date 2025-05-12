/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import styles from "./Dptos.module.css";
import RenderItem from "../shared/RenderItem";
import useCrudUtils from "../shared/useCrudUtils";
import { Children, useEffect, useMemo, useState } from "react";
import ItemList from "@/mk/components/ui/ItemList/ItemList";
import NotAccess from "@/components/layout/NotAccess/NotAccess";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import { useAuth } from "@/mk/contexts/AuthProvider";

import { getFullName, getUrlImages } from "@/mk/utils/string";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { useRouter } from "next/navigation";
import { UnitsType } from "@/mk/utils/utils";
import RenderForm from "./RenderForm";
import ImportDataModal from "@/mk/components/data/ImportDataModal/ImportDataModal";
import { WidgetDashCard } from "@/components/Widgets/WidgetsDashboard/WidgetDashCard/WidgetDashCard";
import {
  IconDepartment,
  IconDepartments,
  IconHome,
} from "@/components/layout/icons/IconsBiblioteca";

const paramsInitial = {
  fullType: "L",
  perPage: 20,
  page: 1,
  searchBy: "",
};
const lTitulars = [
  { id: "S", name: "Disponibles" },
  { id: "C", name: "Habitadas" },
];

const Dptos = () => {
  const router = useRouter();
  const { user, store } = useAuth();
  const [typeUnits, setTypeUnits] = useState([]);

  const client = user.clients.filter(
    (item: any) => item.id === user.client_id
  )[0];
  useEffect(() => {
    setStore({ UnitsType: UnitsType[client?.type_dpto] });
  }, []);

  const mod: ModCrudType = {
    modulo: "dptos",
    // singular: `${store?.UnitsType}`,
    // plural: `${store?.UnitsType}s`,
    singular: "unidad",
    plural: "unidades",
    filter: true,
    permiso: "",
    export: true,
    extraData: true,
    import: true,
    hideActions: {
      view: true,
      add: false,
      edit: true,
      del: true,
    },
    renderForm: (props: {
      item: any;
      setItem: any;
      extraData: any;
      open: boolean;
      onClose: any;
      user: any;
      execute: any;
    }) => <RenderForm {...props} />,
  };

  type StateLabelProps = {
    children: React.ReactNode;
    backgroundColor?: string;
    color?: string;
  };

  const StateLabel = ({
    children,
    backgroundColor,
    color,
  }: StateLabelProps) => {
    return (
      <div
        className={styles.stateLabel}
        style={{
          backgroundColor: backgroundColor,
          color: color,
        }}
      >
        {children}
      </div>
    );
  };

  const fields = useMemo(() => {
    return {
      id: { rules: [], api: "e" },

      nro: {
        rules: ["required"],
        api: "ae",
        // label: "Número de " + store?.UnitsType,
        label: "Unidad",
        form: { type: "text" },
        list: { width: "100px" },
      },

      description: {
        rules: ["required"],
        api: "ae",
        label: "Descripción",
        form: { type: "text" },
        list: false,
      },
      type: {
        rules: ["required"],
        api: "ae",
        label: "Tipo de unidad",
        form: {
          type: "select",
          options: (data: any) => {
            let dataList: any = [];
            data?.extraData?.type?.map((c: any) => {
              dataList.push({
                id: c.id,
                name: c.name,
              });
            });
            return dataList;
          },
        },
        list: {
          onRender: (props: any) => {
            return props?.item?.type?.name || "Sin tipo";
          },
        },
        filter: {
          label: "Tipo de unidad",
          options: (data: any) => {
            // console.log(data, "data")
            let options = [{ id: "", name: "Todos" }];
            data?.type?.forEach((type: any) => {
              options.push({
                id: type.id,
                name: type.name,
              });
            });
            return options;
          },
          optionLabel: "name",
          optionValue: "id",
        },
      },
      expense_amount: {
        rules: ["required"],
        api: "ae",
        label: "Cuota (Bs)",
        form: { type: "text" },
        list: false,
      },
      dimension: {
        rules: ["required"],
        api: "ae",
        label: "Dimensiones en m² ",
        form: { type: "text" },
        list: false,
      },
      homeowner_id: {
        rules: ["required"],
        api: "ae",
        label: "Propietario",

        form: {
          type: "select",
          // optionsExtra: "homeowner",
          // optionLabel:`lastMotherName` ,

          options: (items: any) => {
            let data: any = [];
            items?.extraData?.homeowners?.map((c: any) => {
              // console.log(c,'c')
              data.push({
                id: c.id,
                name: getFullName(c),
              });
            });
            return data;
          },
        },
        list: {
          onRender: (props: any) => {
            return props?.item?.homeowner ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar name={getFullName(props?.item?.homeowner)} />
                <div>
                  <p style={{ color: "var(--cWhite)" }}>
                    {getFullName(props?.item?.homeowner)}
                  </p>
                  <p>CI: {props?.item?.homeowner?.ci || "Sin registro"}</p>
                </div>
              </div>
            ) : (
              "Sin propietario"
            );
          },
        },
      },

      titular: {
        rules: [""],
        api: "",
        label: "Titular",
        // form: { type: "text" },
        list: {
          onRender: (props: any) => {
            // Verificar si titular existe antes de intentar acceder a sus propiedades
            if (!props?.item?.titular) {
              return <div className={styles.noTitular}>Sin titular</div>;
            }

            // También verificar si titular.owner existe
            if (!props?.item?.titular?.owner) {
              return <div className={styles.noTitular}>Titular sin datos</div>;
            }

            return (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar
                  src={getUrlImages(
                    "/OWNER-" +
                      props?.item?.titular?.owner_id +
                      ".webp?d=" +
                      props?.item?.titular?.owner?.updated_at
                  )}
                  name={getFullName(props?.item?.titular?.owner)}
                />
                <div>
                  <p style={{ color: "var(--cWhite)" }}>
                    {getFullName(props?.item?.titular?.owner)}
                  </p>
                  <p>CI: {props?.item?.titular?.owner?.ci || "Sin registro"}</p>
                </div>
              </div>
            );
          },
        },
        filter: {
          label: "Estado",

          options: () => [{ id: "T", name: "Todos" }, ...lTitulars],
          optionLabel: "name",
          optionValue: "id",
        },
        import: true,
      },
      status: {
        rules: [""],
        api: "",
        label: "Estado",
        form: false,
        list: {
          width: "160px",
          onRender: (props: any) => {
            return props?.item?.titular ? (
              <StateLabel
                color="var(--cSuccess)"
                backgroundColor="var(--cHoverSuccess)"
              >
                Habitada
              </StateLabel>
            ) : (
              <StateLabel backgroundColor="var(--cHover)">
                Disponible
              </StateLabel>
            );
          },
        },
      },
    };
  }, []);
  const [openImport, setOpenImport] = useState(false);
  const onImport = () => {
    setOpenImport(true);
  };

  const {
    userCan,
    List,
    setStore,
    onSearch,
    searchs,
    onEdit,
    onDel,
    showToast,
    extraData,
    execute,
    data,
    reLoad,
  } = useCrud({
    paramsInitial,
    mod,
    fields,
    _onImport: onImport,
  });

  const { onLongPress, selItem } = useCrudUtils({
    onSearch,
    searchs,
    setStore,
    mod,
    onEdit,
    onDel,
  });
  const handleRowClick = (item: any) => {
    router.push(`/dashDpto/${item.id}`);
  };

  const renderItem = (
    item: Record<string, any>,
    i: number,
    onClick: Function
  ) => {
    return (
      <RenderItem item={item} onClick={onClick} onLongPress={onLongPress}>
        <ItemList
          title={`Departamento Nº ${item?.numero}`}
          subtitle={item?.descripcion}
          variant="V1"
          active={selItem && selItem.id === item.id}
        />
      </RenderItem>
    );
  };

  // const getFormatTypeUnit = () => {
  //   let untis: any = [];

  //   extraData?.type?.map((c: any) => {
  //     untis.push({ id: c.id, name: c.name, value: 0 });
  //   });

  //   data?.data?.map((c: any) => {
  //     let index = untis.findIndex((item: any) => item.id === c.type.id);
  //     if (index !== -1) {
  //       untis[index].value += 1;
  //     }
  //   });
  //   return untis;
  // };
  const getFormatTypeUnit = () => {
    //  extraData ={
    //     units:{
    //       "total_units": 8,
    //       "Casa": 5,
    //       "Departamento": 2,
    //       "Choza": 1
    //   }
    //   }
    let untis: any = [];
    Object?.keys(extraData?.units || {}).map((c: any, i: number) => {
      if (i !== 0) {
        untis.push({ id: c, name: c, value: extraData?.units[c] });
      }
    });

    return untis;
  };

  type RoundProps = {
    children: React.ReactNode;
    style?: React.CSSProperties;
  };
  const Round = ({ children, style }: RoundProps) => {
    return (
      <div
        style={{
          ...style,
          padding: 8,
          borderRadius: "50%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {children}
      </div>
    );
  };

  if (!userCan(mod.permiso, "R")) return <NotAccess />;
  return (
    <div className={styles.departamentos}>
      <div
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
        }}
      >
        <WidgetDashCard
          title={"Unidades totales"}
          data={data?.message?.total}
          style={{ minWidth: "280px", maxWidth: "260px" }}
          icon={
            <Round
              style={{
                backgroundColor: "var(--cHoverInfo)",
                color: "var(--cInfo)",
              }}
            >
              <IconDepartments />
            </Round>
          }
        />
        {getFormatTypeUnit().map((item: any, i: number) => {
          return (
            <WidgetDashCard
              key={i}
              title={item.name}
              data={item.value}
              style={{ minWidth: "280px", maxWidth: "260px" }}
              icon={
                item?.name === "Casa" ? (
                  <Round
                    style={{
                      backgroundColor: "var(--cHoverSuccess)",
                      color: "var(--cSuccess)",
                    }}
                  >
                    <IconHome />
                  </Round>
                ) : item.name == "Departamento" ? (
                  <Round
                    style={{
                      backgroundColor: "var(--cHoverWarning)",
                      color: "var(--cWarning)",
                    }}
                  >
                    <IconDepartment />
                  </Round>
                ) : (
                  <div style={{ width: 34, height: 34 }} />
                )
              }
            />
          );
        })}
      </div>

      <List onTabletRow={renderItem} onRowClick={handleRowClick} />
      {openImport && (
        <ImportDataModal
          open={openImport}
          onClose={() => {
            setOpenImport(false);
          }}
          mod={mod}
          showToast={showToast}
          reLoad={reLoad}
          execute={execute}
          // getExtraData={getExtraData}
          // requiredCols="DEPARTAMENTO, HABITANTES, HABILITADOS, ESCANOS, CODE"
        />
      )}
    </div>
  );
};

export default Dptos;
