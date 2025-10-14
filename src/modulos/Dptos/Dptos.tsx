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

import { getFullName, getUrlImages, pluralize } from "@/mk/utils/string";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { useRouter } from "next/navigation";
import { UnitsType } from "@/mk/utils/utils";
import RenderForm from "./RenderForm";
import ImportDataModal from "@/mk/components/data/ImportDataModal/ImportDataModal";
import { WidgetDashCard } from "@/components/Widgets/WidgetsDashboard/WidgetDashCard/WidgetDashCard";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import {
  IconDepartments2,
  IconHome,
  IconUnidades,
  IconDepartment,
  IconLocal,
  IconGarage,
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

const renderDepartmentIcon = (name: string, isEmpty: boolean) => {
  if (name === "Casa") {
    return (
      <IconHome
        color={isEmpty ? "var(--cWhiteV1)" : "var(--cSuccess)"}
        style={{
          backgroundColor: isEmpty ? "var(--cHover)" : "var(--cHoverCompl2)",
        }}
        circle
        size={18}
      />
    );
  } else if (name === "Departamento") {
    return (
      <IconDepartment
        color={isEmpty ? "var(--cWhiteV1)" : "var(--cWarning)"}
        style={{
          backgroundColor: isEmpty ? "var(--cHover)" : "var(--cHoverCompl4)",
        }}
        circle
        size={18}
      />
    );
  } else if (name === "Local") {
    return (
      <IconLocal
        color={isEmpty ? "var(--cWhiteV1)" : "var(--cAlert)"}
        style={{
          backgroundColor: isEmpty ? "var(--cHover)" : "var(--cHoverCompl9)",
        }}
        circle
        size={18}
      />
    );
  } else if (name === "Garaje") {
    return (
      <IconGarage
        color={isEmpty ? "var(--cWhiteV1)" : "var(--cCompl4)"}
        style={{
          backgroundColor: isEmpty ? "var(--cHover)" : "var(--cHoverCompl7)",
        }}
        circle
        size={18}
      />
    );
  }
  // Ícono por defecto para tipos de unidades no conocidas
  return (
    <IconUnidades
      color={isEmpty ? "var(--cWhiteV1)" : "var(--cWhite)"}
      style={{
        backgroundColor: isEmpty ? "var(--cHover)" : "var(--cHoverCompl1)",
      }}
      circle
      size={18}
    />
  );
};

const Dptos = () => {
  const router = useRouter();
  const { user } = useAuth();

  const client = user?.clients?.filter(
    (item: any) => item?.id === user?.client_id
  )[0];

  const { setStore, store } = useAuth();

  useEffect(() => {
    setStore({ ...store, UnitsType: UnitsType[client?.type_dpto], title: "" });
  }, []);

  const mod: ModCrudType = {
    modulo: "dptos",
    singular: "",
    plural: "",
    filter: true,
    permiso: "",
    export: true,
    extraData: true,
    import: false,
    titleAdd: "Nueva unidad",
    hideActions: {
      view: true,
      add: false,
      edit: true,
      del: true,
    },
    saveMsg: {
      add: `Unidad registrada con éxito`,
      edit: `Unidad actualizada con éxito`,
      del: `Unidad eliminada con éxito`,
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
        rules: [],
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
            let options = [{ id: "ALL", name: "Todos" }];
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

          options: (items: any) => {
            let data: any = [];
            items?.extraData?.homeowners?.map((c: any) => {
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
                <Avatar
                  hasImage={props?.item?.homeowner?.has_image}
                  src={getUrlImages(
                    "/OWNER-" +
                      props?.item?.homeowner?.id +
                      ".webp?d=" +
                      props?.item?.homeowner?.updated_at
                  )}
                  name={getFullName(props?.item?.homeowner)}
                />
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
        label: "Residente",
        list: {
          onRender: (props: any) => {
            // Decide titular based on holder flag: 'H' -> homeowner, 'T' -> tenant
            const tenant = props?.item?.tenant;
            // const homeowner = props?.item?.homeowner;
            // const person = tenant ? tenant : homeowner;
            const hasLived = props?.item?.dpto_owners?.length > 0;

            if (!tenant && !hasLived) {
              return <div className={styles.noTitular}>Sin residente</div>;
            }

            const personId = tenant?.id;
            const updatedAt = tenant?.updated_at || tenant?.updatedAt || "";

            return (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar
                  hasImage={tenant?.has_image}
                  src={getUrlImages(
                    "/OWNER-" + personId + ".webp?d=" + updatedAt
                  )}
                  name={getFullName(tenant)}
                />
                <div>
                  <p style={{ color: "var(--cWhite)" }}>
                    {getFullName(tenant)}
                  </p>
                  <p>CI: {tenant?.ci || "Sin registro"}</p>
                </div>
              </div>
            );
          },
        },
        filter: {
          label: "Estado",

          options: () => [{ id: "ALL", name: "Todos" }, ...lTitulars],
          optionLabel: "name",
          optionValue: "id",
        },
        import: true,
      },
      status: {
        rules: [""],
        api: "",
        label: (
          <span
            style={{ display: "block", textAlign: "center", width: "100%" }}
          >
            Estado
          </span>
        ),
        form: false,
        list: {
          width: "160px",
          onRender: (props: any) => {
            // Use dpto_owners relationship: if it has items -> Habitada, else Disponible
            const owners = props?.item?.dpto_owners;
            const isOccupied = Array.isArray(owners)
              ? owners.length > 0
              : !!owners;
            return (
              <div className={styles.statusCellCenter}>
                {isOccupied ? (
                  <StatusBadge
                    color="var(--cSuccess)"
                    backgroundColor="var(--cHoverSuccess)"
                  >
                    Habitada
                  </StatusBadge>
                ) : (
                  <StatusBadge
                    color="var(--cWhite)"
                    backgroundColor="var(--cHover)"
                  >
                    Disponible
                  </StatusBadge>
                )}
              </div>
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

  // Custom filter function to map 'titular' to 'status'
  const getFilter = (opt: string, value: string, oldFilter: any) => {
    if (opt === "titular") {
      // Remove the 'titular' key and add 'status' instead
      const { titular, ...restFilters } = oldFilter.filterBy || {};
      return { filterBy: { ...restFilters, status: value } };
    }
    return { filterBy: { ...oldFilter.filterBy, [opt]: value } };
  };

  const {
    userCan,
    List,
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
    getFilter,
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
    router.push(`/units/${item.id}`);
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
      <h1 className={styles.dashboardTitle}>Unidades</h1>
      <div className={styles.allStatsRow}>
        <WidgetDashCard
          title={"Unidades totales"}
          data={data?.message?.total || 0}
          style={{ minWidth: "280px", maxWidth: "260px" }}
          icon={
            <IconUnidades
              color={
                !data?.message?.total || data?.message?.total === 0
                  ? "var(--cWhiteV1)"
                  : "var(--cInfo)"
              }
              style={{
                backgroundColor:
                  !data?.message?.total || data?.message?.total === 0
                    ? "var(--cHover)"
                    : "var(--cHoverCompl3)",
              }}
              circle
              size={18}
            />
          }
        />
        {getFormatTypeUnit().map((item: any, i: number) => {
          const isEmpty = !item.value || item.value === 0;
          const pluralizedTitle =
            pluralize(item.name, item.value || 0)
              .charAt(0)
              .toUpperCase() + pluralize(item.name, item.value || 0).slice(1);
          return (
            <WidgetDashCard
              key={i}
              title={pluralizedTitle}
              data={item.value}
              style={{ minWidth: "160px", maxWidth: "268px" }}
              icon={renderDepartmentIcon(item.name, isEmpty)}
            />
          );
        })}
      </div>

      <div className={styles.listContainer}>
        <List
          onTabletRow={renderItem}
          height={"calc(100vh - 450px)"}
          onRowClick={handleRowClick}
          emptyMsg="Lista vacía. Una vez registres las diferentes unidades"
          emptyLine2="del condominio las verás aquí."
          emptyIcon={<IconDepartments2 size={80} color="var(--cWhiteV1)" />}
        />
      </div>
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
