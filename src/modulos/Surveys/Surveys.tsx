"use client";
import React, { useState } from "react";
import styles from "./Surveys.module.css";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import useCrud from "@/mk/hooks/useCrud/useCrud";
import { getSurveyConfig } from "./config/surveys.config";
import { SurveyItemData } from "./types/surveys.types";
import DateRangeFilterModal from "@/components/DateRangeFilterModal/DateRangeFilterModal";

const paramsInitial = {
  fullType: "CRUD",
  perPage: 20,
  page: 1,
  searchBy: "",
};

const Surveys = () => {
  const [openCustomFilter, setOpenCustomFilter] = useState(false);
  const [customDateErrors, setCustomDateErrors] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  // Use ref to break circular dependency between config and useCrud
  const triggerReloadRef = React.useRef<any>(() => {});
  const { mod, fields } = React.useMemo(
    () => getSurveyConfig((...args: any[]) => triggerReloadRef.current(...args)),
    []
  );

  // Memoize filter handler to prevent useCrud re-initialization
  const handleGetFilter = React.useCallback((opt: string, value: string, oldFilterState: any) => {
    const currentFilters = { ...(oldFilterState?.filterBy || {}) };

    if (opt === "created_at" && value === "custom") {
      setCustomDateErrors({});
      setOpenCustomFilter(true);
      delete currentFilters[opt];
      return { filterBy: currentFilters };
    }

    if (value === "" || value === null || value === undefined || value === "ALL") {
      delete currentFilters[opt];
    } else {
      currentFilters[opt] = value;
    }
    return { filterBy: currentFilters };
  }, []);

  const { userCan, List, onView, reLoad, onFilter } = useCrud({
    paramsInitial,
    mod,
    fields,
    getFilter: handleGetFilter,
  });

  // Assign the real reLoad function to the ref
  triggerReloadRef.current = reLoad;

  const handleRowClick = (item: SurveyItemData) => {
    onView(item);
  };

  if (!userCan(mod.permiso, "R")) return <NotAccess />;

  return (
    <div className={styles.surveysContainer}>
      <h1 className={styles.title}>Encuestas</h1>
      <List  height={"calc(100vh - 310px)"} onRowClick={handleRowClick} />
      <DateRangeFilterModal
        open={openCustomFilter}
        onClose={() => {
          setOpenCustomFilter(false);
          setCustomDateErrors({});
        }}
        onSave={({ startDate, endDate }: { startDate: string; endDate: string }) => {
          let err: { startDate?: string; endDate?: string } = {};
          if (!startDate) err.startDate = "La fecha de inicio es obligatoria";
          if (!endDate) err.endDate = "La fecha de fin es obligatoria";
          if (startDate && endDate && startDate > endDate)
            err.startDate = "La fecha de inicio no puede ser mayor a la de fin";
          if (Object.keys(err).length > 0) {
            setCustomDateErrors(err);
            return;
          }
          onFilter("created_at", `${startDate},${endDate}`);
          setOpenCustomFilter(false);
          setCustomDateErrors({});
        }}
        errorStart={customDateErrors.startDate}
        errorEnd={customDateErrors.endDate}
      />
    </div>
  );
};

export default Surveys;
