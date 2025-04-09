/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import styles from "./Dptos.module.css";
import RenderItem from "../shared/RenderItem";
import useCrudUtils from "../shared/useCrudUtils";
import { useEffect, useMemo, useState } from "react";
import ItemList from "@/mk/components/ui/ItemList/ItemList";
import NotAccess from "@/components/layout/NotAccess/NotAccess";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import { useAuth } from "@/mk/contexts/AuthProvider";

import { getFullName, getUrlImages } from "@/mk/utils/string";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { useRouter } from "next/navigation";
import { UnitsType } from "@/mk/utils/utils";

const paramsInitial = {
  fullType: "L",
  perPage: 10,
  page: 1,
  searchBy: "",
};
const lTitulars = [
  { id: "S", name: "Sin Titular" },
  { id: "T", name: "Con Titular" },
];

const Dptos = () => {
  const router = useRouter();
  const { user, store } = useAuth();

  const client = user.clients.filter(
    (item: any) => item.id === user.client_id
  )[0];
  useEffect(() => {
    setStore({ UnitsType: UnitsType[client.type_dpto] });
  }, []);

  const mod: ModCrudType = {
    modulo: "dptos",
    singular: `${store?.UnitsType}`,
    plural: `${store?.UnitsType}s`,
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
  };
  const fields = useMemo(() => {
    return {
      id: { rules: [], api: "e" },

      nro: {
        rules: ["required"],
        api: "ae",
        label: "Número de " + store?.UnitsType,
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
         
          options: () => [
            { id: "", name: "Todos" },
            ...lTitulars
          ],
          optionLabel: "name",
          optionValue: "id"
        },
        import: true
      },
    };
  }, []);

  const { userCan, List, setStore, onSearch, searchs, onEdit, onDel } = useCrud(
    {
      paramsInitial,
      mod,
      fields,
    }
  );

  const { onLongPress, selItem, searchState } = useCrudUtils({
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

  if (!userCan(mod.permiso, "R")) return <NotAccess />;
  return (
    <div className={styles.departamentos}>
      <List onTabletRow={renderItem} onRowClick={handleRowClick} />
    </div>
  );
};

export default Dptos;