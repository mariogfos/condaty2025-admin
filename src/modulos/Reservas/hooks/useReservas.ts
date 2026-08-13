"use client";
import { useCallback, useMemo, useState } from "react";
import useCrud from "@/mk/hooks/useCrud/useCrud";
import useCrudUtils from "@/modulos/shared/useCrudUtils";
import {
  getReservationsConfig,
  RESERVATIONS_INITIAL_PARAMS,
} from "../config/reservas.config";
import {
  CUSTOM_PERIOD_ERRORS,
  CUSTOM_PERIOD_ID,
} from "../config/reservas.constants";

type CustomPeriodErrors = {
  startDate?: string;
  endDate?: string;
};

type CustomPeriodRange = {
  startDate?: string;
  endDate?: string;
};

type FilterState = {
  filterBy?: Record<string, string>;
};

/**
 * Valida el período personalizado del filtro de fecha.
 *
 * Función pura y exportada a propósito: son cuatro reglas de negocio (las dos
 * fechas obligatorias, el orden, y el mismo año) que se pueden medir sin
 * montar un modal.
 *
 * ⚠️ La regla del mismo año no es capricho: el `PeriodFilter` del API arma la
 * ventana sobre un año calendario, y un rango que la cruza devuelve filas que
 * el usuario no pidió.
 */
export const validateCustomPeriod = ({
  startDate,
  endDate,
}: CustomPeriodRange): CustomPeriodErrors => {
  const errors: CustomPeriodErrors = {};

  if (!startDate) errors.startDate = CUSTOM_PERIOD_ERRORS.startRequired;
  if (!endDate) errors.endDate = CUSTOM_PERIOD_ERRORS.endRequired;
  if (startDate && endDate && startDate > endDate) {
    errors.startDate = CUSTOM_PERIOD_ERRORS.startAfterEnd;
  }
  if (startDate && endDate && startDate.slice(0, 4) !== endDate.slice(0, 4)) {
    errors.startDate = CUSTOM_PERIOD_ERRORS.sameYear;
    errors.endDate = CUSTOM_PERIOD_ERRORS.sameYear;
  }

  return errors;
};

/**
 * El container de la lista de Reservas: datos, filtros y acciones. Sin JSX.
 *
 * Lo único que hace de más respecto de un `useCrud` pelado es interceptar el
 * período "Personalizado": ese valor no viaja al API, abre un modal que
 * devuelve un rango `desde,hasta`.
 */
export const useReservas = () => {
  const [openCustomFilter, setOpenCustomFilter] = useState(false);
  const [customDateErrors, setCustomDateErrors] = useState<CustomPeriodErrors>(
    {},
  );

  const { mod, fields } = useMemo(() => getReservationsConfig(), []);

  /**
   * Arma el nuevo `filterBy` a partir del que había.
   *
   * `useCrud` lo llama con la opción tocada y lo que se eligió; devolver el
   * mapa sin la clave equivale a sacar el filtro.
   */
  const handleGetFilter = useCallback(
    (opt: string, value: string, oldFilterState: FilterState) => {
      const currentFilters = { ...(oldFilterState?.filterBy || {}) };

      if (opt === "date_at" && value === CUSTOM_PERIOD_ID) {
        // "Personalizado" no es un período que el API entienda: abre el modal
        // y, hasta que el usuario elija un rango, no filtra por fecha.
        setCustomDateErrors({});
        setOpenCustomFilter(true);
        delete currentFilters[opt];
        return { filterBy: currentFilters };
      }

      if (value === "" || value === null || value === undefined) {
        delete currentFilters[opt];
      } else {
        currentFilters[opt] = value;
      }

      return { filterBy: currentFilters };
    },
    [],
  );

  const crud = useCrud({
    paramsInitial: RESERVATIONS_INITIAL_PARAMS,
    mod,
    fields,
    getFilter: handleGetFilter,
  });

  const { onLongPress, selItem } = useCrudUtils({
    onSearch: crud.onSearch,
    searchs: crud.searchs,
    setStore: crud.setStore,
    mod,
    onEdit: crud.onEdit,
    onDel: crud.onDel,
  });

  const onSaveCustomPeriod = useCallback(
    ({ startDate, endDate }: CustomPeriodRange) => {
      const errors = validateCustomPeriod({ startDate, endDate });

      if (Object.keys(errors).length > 0) {
        setCustomDateErrors(errors);
        return;
      }

      crud.onFilter("date_at", `${startDate},${endDate}`);
      setOpenCustomFilter(false);
      setCustomDateErrors({});
    },
    [crud.onFilter],
  );

  const onCloseCustomPeriod = useCallback(() => {
    setOpenCustomFilter(false);
    setCustomDateErrors({});
  }, []);

  return {
    // Del CRUD
    List: crud.List,
    userCan: crud.userCan,
    onLongPress,
    selItem,
    modPermission: mod.permiso,

    // Período personalizado
    openCustomFilter,
    customDateErrors,
    onSaveCustomPeriod,
    onCloseCustomPeriod,
  };
};

export default useReservas;
