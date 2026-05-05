"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./Assemblies.module.css";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import { WidgetDashCard } from "@/components/Widgets/WidgetsDashboard/WidgetDashCard/WidgetDashCard";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
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
  const [dateRangeFilter, setDateRangeFilter] = useState<{
    startDate: string;
    endDate: string;
  } | null>(null);
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);

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

  const { userCan, List, data, reLoad, onEdit, onCloseView, params, setParams } = useCrud({
    paramsInitial,
    mod,
    fields,
    // P.21b: Si se selecciona "Todos" (ALL) o vacío, no enviar el filtro al API
    getFilter: (opt: string, value: string, oldFilter: any) => ({
      filterBy: {
        ...oldFilter.filterBy,
        [opt]: value === "ALL" || value === "" ? "" : value,
      },
    }),
  });

  // Assign the real functions to the refs
  triggerReloadRef.current = reLoad;
  onEditRef.current = onEdit;
  onCloseViewRef.current = onCloseView;

  // Handle date range filter save
  const handleDateRangeSave = (range: { startDate: string; endDate: string }) => {
    const newParams = { ...params, page: 1 };
    if (range.startDate) {
      newParams.start_date_from = range.startDate;
    } else {
      delete newParams.start_date_from;
    }
    if (range.endDate) {
      newParams.start_date_to = range.endDate;
    } else {
      delete newParams.start_date_to;
    }
    setParams(newParams);
    setDateRangeFilter(range);
    setIsDateFilterOpen(false);
  };

  // Clear date range filter
  const handleClearDateFilter = () => {
    const newParams = { ...params, page: 1 };
    delete newParams.start_date_from;
    delete newParams.start_date_to;
    setParams(newParams);
    setDateRangeFilter(null);
  };

  // Date filter button component
  const dateFilterButton = (
    <button
      onClick={() => setIsDateFilterOpen(true)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 12px",
        backgroundColor: dateRangeFilter ? "var(--cPrimary)" : "var(--cModalSurfaceRaised)",
        border: `1px solid ${dateRangeFilter ? "var(--cPrimary)" : "var(--cModalBorder)"}`,
        borderRadius: 8,
        color: dateRangeFilter ? "var(--cWhite)" : "var(--cWhiteV1)",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        height: 44,
      }}
    >
      <IconCalendar size={16} />
      {dateRangeFilter
        ? `${dateRangeFilter.startDate} - ${dateRangeFilter.endDate}`
        : "Por fecha"}
    </button>
  );

  const clearDateButton = dateRangeFilter ? (
    <button
      onClick={handleClearDateFilter}
      style={{
        padding: "8px 12px",
        backgroundColor: "transparent",
        border: "1px solid var(--cModalBorder)",
        borderRadius: 8,
        color: "var(--cWhiteV3)",
        fontSize: 13,
        cursor: "pointer",
        height: 44,
      }}
    >
      Limpiar
    </button>
  ) : null;

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
        {/* Date range filter toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          {dateFilterButton}
          {clearDateButton}
        </div>
        <List
          title={""}
          height={"calc(100vh - 420px)"}
          emptyMsg="Lista vacía. Cuando registres asambleas"
          emptyLine2="las verás aquí."
          emptyIcon={<IconCalendar size={80} color="var(--cWhiteV1)" />}
          onRowClick={handleRowClick}
        />
      </div>

      <DateRangeFilterModal
        open={isDateFilterOpen}
        onClose={() => setIsDateFilterOpen(false)}
        onSave={handleDateRangeSave}
        labelStart="Desde"
        labelEnd="Hasta"
        initialStartDate={dateRangeFilter?.startDate || ""}
        initialEndDate={dateRangeFilter?.endDate || ""}
        buttonText="Aplicar"
      />
    </div>
  );
};

export default Assemblies;
