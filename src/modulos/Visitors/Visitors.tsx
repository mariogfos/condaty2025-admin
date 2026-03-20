"use client";

import React, { useEffect, useMemo } from "react";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import { getDateTimeStrMesShort } from "@/mk/utils/date";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import { IconExitHome } from "@/components/layout/icons/IconsBiblioteca";

const paramsInitial = {
  fullType: "VS",
  perPage: -1,
  page: 1,
  extraData: false,
};

const Visitors = () => {
  const getVisitImage = (item: any) => {
    const raw = item?.visit?.url_image_a?.[0];
    if (!raw) return "";
    return String(raw).replace(/[`"' ]/g, "");
  };

  const getVisitName = (item: any) => {
    return item?.visit?.full_name || "Sin nombre";
  };

  const modVisitors: ModCrudType = useMemo(() => {
    return {
      modulo: "accesses",
      singular: "Visitante",
      plural: "Visitantes",
      permiso: "accesses",
      export: false,
      filter: false,
      search: true,
      noWaiting: true,
      hideActions: {
        add: true,
        edit: true,
        del: true,
        view: true,
      },
    };
  }, []);

  const fieldsVisitors = useMemo(() => {
    return {
      id: { rules: [], api: "e" },
      visitor: {
        rules: [""],
        api: "",
        label: "Visitante",
        list: {
          onRender: (props: any) => {
            return (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Avatar
                  name={getVisitName(props.item)}
                  src={getVisitImage(props.item)}
                  w={36}
                  h={36}
                />
                <div>{getVisitName(props.item)}</div>
              </div>
            );
          },
        },
      },
      total_visits: {
        rules: [""],
        api: "",
        label: "N° de accesos",
        list: {
          onRender: (props: any) => (
            <div>
              {props.item.total_visits > 1
                ? props.item.total_visits + " veces"
                : "1 vez"}
            </div>
          ),
        },
      },
      first_entry: {
        rules: [""],
        api: "",
        label: "Primer acceso",
        list: {
          onRender: (props: any) => (
            <div>
              {props.item.first_entry
                ? getDateTimeStrMesShort(props.item.first_entry)
                : "-/-"}
            </div>
          ),
        },
      },
      last_entry: {
        rules: [""],
        api: "",
        label: "Último accesso",
        list: {
          onRender: (props: any) => (
            <div>
              {props.item.last_entry
                ? getDateTimeStrMesShort(props.item.last_entry)
                : "-/-"}
            </div>
          ),
        },
      },
    };
  }, []);

  const { userCan, List, setStore } = useCrud({
    paramsInitial,
    mod: modVisitors,
    fields: fieldsVisitors,
  });

  useEffect(() => {
    setStore((prev: any) => ({ ...prev, title: "Visitantes" }));
  }, [setStore]);

  const canAccess = userCan(modVisitors.permiso, "R");
  if (!canAccess) return <NotAccess />;

  return (
    <List
      height={"calc(100vh - 350px)"}
      emptyMsg="No hay visitantes registrados aún."
      emptyLine2="Cuando se registren accesos, se mostrarán aquí."
      emptyIcon={<IconExitHome size={80} color="var(--cWhiteV1)" />}
      filterBreakPoint={1700}
    />
  );
};

export default Visitors;
