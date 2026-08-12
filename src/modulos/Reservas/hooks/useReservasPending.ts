"use client";
import { useMemo } from "react";
import useCrud from "@/mk/hooks/useCrud/useCrud";
import useCrudUtils from "@/modulos/shared/useCrudUtils";
import {
  getPendingReservationsConfig,
  PENDING_RESERVATIONS_INITIAL_PARAMS,
} from "../config/reservasPending.config";

/**
 * El container de la pestaña "Reservas pendientes".
 *
 * Es la misma lista con un `filterBy=status:1` fijo. No hay filtros de
 * usuario: el estado ya está decidido por la pestaña.
 */
export const useReservasPending = () => {
  const { mod, fields } = useMemo(() => getPendingReservationsConfig(), []);

  const crud = useCrud({
    paramsInitial: PENDING_RESERVATIONS_INITIAL_PARAMS,
    mod,
    fields,
  });

  const { onLongPress, selItem } = useCrudUtils({
    onSearch: crud.onSearch,
    searchs: crud.searchs,
    setStore: crud.setStore,
    mod,
    onEdit: crud.onEdit,
    onDel: crud.onDel,
  });

  return {
    List: crud.List,
    userCan: crud.userCan,
    modPermission: mod.permiso,
    onLongPress,
    selItem,
  };
};

export default useReservasPending;
