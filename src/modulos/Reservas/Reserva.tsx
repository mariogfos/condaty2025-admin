"use client";
import useCrud from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";

import ItemList from "@/mk/components/ui/ItemList/ItemList";
import useCrudUtils from "../shared/useCrudUtils";
import { useMemo } from "react";
import RenderItem from "../shared/RenderItem";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import RenderView from "./RenderView/RenderView";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { getDateTimeStrMes } from "@/mk/utils/date";
import styles from "./Reserva.module.css";

const mod = {
  modulo: "reservations",
  singular: "Reserva",
  plural: "Reservas",
  permiso: "",
  extraData: true,
  hideActions: { edit: true, del: true, add: true, view: true },
  renderView: (props: any) => <RenderView {...props} />,
  loadView: { fullType: "DET" } // Esto cargará los detalles completos al hacer clic
};

const paramsInitial = {
  perPage: 10,
  page: 1,
  fullType: "L",
  searchBy: "",
};


const Reserva = () => {
  const fields = useMemo(
    () => ({
      id: { rules: [], api: "e" },
      area: {
        rules: ["required"],
        api: "ae",
        label: "Área Social",
        form: { type: "text" },
        list: {
          onRender: (props: any) => {
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar
                src={getUrlImages(
                  "/AREA-" +
                    props?.item?.area?.images?.[0].area_id+ "-"+ props?.item?.area?.images?.[0].id +
                              ".webp?d=" +
                              props?.item?.area?.updated_at
                          )}
                          square
                        />
                        <div>
                          <p>{props?.item?.area.name} </p>
                        </div>
                      </div>
          );
        }
      },
      },
      owner: {
        rules: ["required"],
        api: "ae",
        label: "Residente",
        form: { type: "text" },
        list: {
          onRender: (props: any) => {
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar
                src={getUrlImages(
                  "/OWNER-" +
                    props?.item?.owner.id +
                              ".webp?d=" +
                              props?.item?.owner.updated_at
                          )}
                          name={getFullName(props?.item.owner)}
                          square
                        />
                        <div>
                          <p>{getFullName(props?.item.owner)} </p>
                        </div>
                      </div>
          );
        }
      },
      },
      date_at: {
        rules: ["required"],
        api: "ae",
        label: "Fecha del evento",
        form: { type: "date" },
        list: {
          onRender: (props: any) => {
            return <div>{getDateTimeStrMes(props?.item?.date_at)}</div>;
          },
        },
      },
      status: {
        rules: ["required"],
        api: "ae",
        label: "Estado",
        form: { 
            type: "select", 
            options: [
                { id: "A", name: "Disponible" }, 
                { id: "X", name: "No disponible" },
                { id: "M", name: "En mantenimiento" }
            ] 
        },
        list: {
          onRender: (props: any) => {
              const status = props?.item?.status as 'A' | 'X' | 'M' | undefined;
              const statusMap = {
                  A: { label: "Disponible", class: styles.statusA },
                  X: { label: "No disponible", class: styles.statusX },
                  M: { label: "En mantenimiento", class: styles.statusM }
              };
              
              return (
                  <div className={`${styles.statusBadge} ${status ? statusMap[status]?.class : ''}`}>
                      {status ? statusMap[status]?.label : 'Estado desconocido'}
                  </div>
              );
          },
      },
    },
    }),
    []
  );

  const {
    userCan,
    List,
    setStore,
    onSearch,
    searchs,
    onEdit,
    onDel,
    extraData,
    findOptions,
  } = useCrud({
    paramsInitial,
    mod,
    fields,
  });
  const { onLongPress, selItem } = useCrudUtils({
    onSearch,
    searchs,
    setStore,
    mod,
    onEdit,
    onDel,
  });

  if (!userCan(mod.permiso, "R")) return <NotAccess />;
  return (
    <div >
      <List />
    </div>
  );
};

export default Reserva;
