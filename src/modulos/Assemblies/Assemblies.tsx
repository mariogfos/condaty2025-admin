"use client";

import React, { useMemo, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./Assemblies.module.css";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import useCrud from "@/mk/hooks/useCrud/useCrud";
import { WidgetDashCard } from "@/components/Widgets/WidgetsDashboard/WidgetDashCard/WidgetDashCard";
import { IconCalendar } from "@/components/layout/icons/IconsBiblioteca";
import { getAssemblyConfig } from "./config/assemblies.config";
import { Assembly } from "./types/assemblies.types";
import DateRangeFilterModal from "@/components/DateRangeFilterModal/DateRangeFilterModal";

const paramsInitial = {
  fullType: "L",
  perPage: 20,
  page: 1,
  searchBy: "",
};

const Assemblies = () => {
  const router = useRouter();
  const [openCustomFilter, setOpenCustomFilter] = useState(false);
  const [currentFilterField, setCurrentFilterField] = useState("");
  const [customDateErrors, setCustomDateErrors] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  // Use refs to break circular dependency between config and useCrud
  const triggerReloadRef = React.useRef<any>(() => {});
  const onEditRef = React.useRef<any>(() => {});
  const onCloseViewRef = React.useRef<any>(() => {});

  const { mod, fields } = React.useMemo(
    () =>
      getAssemblyConfig(
        (...args: any[]) => triggerReloadRef.current(...args),
        (item: any) => onEditRef.current(item),
        () => onCloseViewRef.current(),
      ),
    [],
  );

  const handleGetFilter = useCallback(
    (opt: string, value: string, oldFilter: any) => {
      const currentFilters = { ...(oldFilter?.filterBy || {}) };

      if (value === "custom") {
        setCustomDateErrors({});
        setCurrentFilterField(opt);
        setOpenCustomFilter(true);
        delete currentFilters[opt];
        return { filterBy: currentFilters };
      }

      if (
        value === "ALL" ||
        value === "" ||
        value === null ||
        value === undefined
      ) {
        delete currentFilters[opt];
      } else {
        currentFilters[opt] = value;
      }
      return { filterBy: currentFilters };
    },
    [],
  );

  const { userCan, List, data, reLoad, onEdit, onCloseView, onFilter } =
    useCrud({
      paramsInitial,
      mod,
      fields,
      getFilter: handleGetFilter,
    });

  // Assign the real functions to the refs
  triggerReloadRef.current = reLoad;
  onEditRef.current = onEdit;
  onCloseViewRef.current = onCloseView;

  const handleRowClick = (item: Assembly) => {
    console.log("click en fila", item);
    router.push(`/assemblies/${item.id}`);
  };

  const metrics = data?.message || {};
  const total = metrics?.total ?? 0;
  const pending = metrics?.S ?? 0;
  const inProgress = metrics?.P ?? 0;
  const completed = metrics?.C ?? 0;
  const canceled = metrics?.X ?? 0;

  if (!userCan(mod.permiso, "R")) return <NotAccess />;

  return (
    <div className={styles.assemblies}>
      <h1 className={styles.title}>{mod.plural}</h1>

      <div className={styles.statsRow}>
        <WidgetDashCard
          title="Total"
          data={total}
          style={{ minWidth: "160px", maxWidth: "260px" }}
        />
        <WidgetDashCard
          title="Programadas"
          data={pending}
          color="#A78BFA"
          style={{ minWidth: "160px", maxWidth: "260px" }}
        />
        <WidgetDashCard
          title="En progreso"
          data={inProgress}
          color="#FFCF4A"
          style={{ minWidth: "160px", maxWidth: "260px" }}
        />
        <WidgetDashCard
          title="Finalizadas"
          data={completed}
          color="var(--cSuccess)"
          style={{ minWidth: "160px", maxWidth: "260px" }}
        />
        <WidgetDashCard
          title="Canceladas"
          data={canceled}
          color="var(--cError)"
          style={{ minWidth: "160px", maxWidth: "260px" }}
        />
      </div>

      <div className={styles.listContainer}>
        <List
          title={""}
          height={"100%"}
          emptyMsg="Lista vacía. Cuando registres asambleas"
          emptyLine2="las verás aquí."
          emptyIcon={<IconCalendar size={80} color="var(--cWhiteV1)" />}
          onRowClick={handleRowClick}
          filterBreakPoint={1400}
        />
      </div>
      <DateRangeFilterModal
        open={openCustomFilter}
        onClose={() => {
          setOpenCustomFilter(false);
          setCustomDateErrors({});
        }}
        onSave={({
          startDate,
          endDate,
        }: {
          startDate: string;
          endDate: string;
        }) => {
          let err: { startDate?: string; endDate?: string } = {};
          if (!startDate) err.startDate = "La fecha de inicio es obligatoria";
          if (!endDate) err.endDate = "La fecha de fin es obligatoria";
          if (startDate && endDate && startDate > endDate)
            err.startDate = "La fecha de inicio no puede ser mayor a la de fin";
          if (Object.keys(err).length > 0) {
            setCustomDateErrors(err);
            return;
          }
          onFilter(currentFilterField, `${startDate},${endDate}`);
          setOpenCustomFilter(false);
          setCustomDateErrors({});
        }}
        errorStart={customDateErrors.startDate}
        errorEnd={customDateErrors.endDate}
      />
    </div>
  );
};

export default Assemblies;
