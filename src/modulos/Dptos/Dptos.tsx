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
  { id: "S", name: "Sin Titular" },
  { id: "C", name: "Con Titular" },
  { id: "T", name: "Todos" },
];

const Dptos = () => {
  const router = useRouter();
  const { user, store } = useAuth();
  const [typeUnits, setTypeUnits] = useState([]);

  const client = user.clients.filter(
    (item: any) => item.id === user.client_id
  )[0];
  useEffect(() => {
    setStore({ UnitsType: UnitsType[client.type_dpto] });
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
      edit: false,
      del: false,
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
        list: true,
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
            return getFullName(props?.item?.homeowner) || "Sin propietario";
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
                  square
                />
                <div>
                  <p>{getFullName(props?.item?.titular?.owner)}</p>
                </div>
              </div>
            );
          },
        },
        filter: {
          label: "Titular",

          options: () => [{ id: "", name: "Todos" }, ...lTitulars],
          optionLabel: "name",
          optionValue: "id",
        },
        import: true,
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

  const getFormatTypeUnit = () => {
    let untis: any = [];

    extraData?.type?.map((c: any) => {
      untis.push({ id: c.id, name: c.name, value: 0 });
    });

    data?.data?.map((c: any) => {
      let index = untis.findIndex((item: any) => item.id === c.type.id);
      if (index !== -1) {
        untis[index].value += 1;
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
        }}
      >
        <WidgetDashCard
          title={"Unidades totales"}
          data={data?.message?.total}
          style={{}}
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
              style={{}}
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
                ) : null
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
