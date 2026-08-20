"use client";
import React from "react";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import styles from "./Payments.module.css";
import { IconIngresos } from "@/components/layout/icons/IconsBiblioteca";
import DateRangeFilterModal from "@/components/DateRangeFilterModal/DateRangeFilterModal";
import usePayments from "./hooks/usePayments";

import { MESSAGES } from "./Type/PaymentType";

const Payments = () => {
  const {
    List,
    onFilter,
    userCan,
    modPermission,
    openCustomFilter,
    setOpenCustomFilter,
    customDateErrors,
    setCustomDateErrors,
    rowContextMenu,
  } = usePayments();

  if (!userCan(modPermission, "R")) return <NotAccess />;

  return (
    <div className={styles.container}>
      <List
        height={"100%"}
        emptyMsg={MESSAGES.emptyList}
        emptyLine2={MESSAGES.emptyListLine2}
        emptyIcon={<IconIngresos size={80} color="var(--cWhiteV1)" />}
        filterBreakPoint={1700}
        rowContextMenu={rowContextMenu}
      />
      <DateRangeFilterModal
        open={openCustomFilter}
        onClose={() => {
          setOpenCustomFilter(false);
          setCustomDateErrors({});
        }}
        onSave={({ startDate, endDate }) => {
          let err: { startDate?: string; endDate?: string } = {};
          if (!startDate) err.startDate = "La fecha de inicio es obligatoria";
          if (!endDate) err.endDate = "La fecha de fin es obligatoria";
          if (startDate && endDate && startDate > endDate)
            err.startDate = "La fecha de inicio no puede ser mayor a la de fin";
          if (
            startDate &&
            endDate &&
            startDate.slice(0, 4) !== endDate.slice(0, 4)
          ) {
            err.startDate =
              "El periodo personalizado debe estar dentro del mismo año";
            err.endDate =
              "El periodo personalizado debe estar dentro del mismo año";
          }
          if (Object.keys(err).length > 0) {
            setCustomDateErrors(err);
            return;
          }
          const customDateFilterString = `${startDate},${endDate}`;
          onFilter("paid_at", customDateFilterString);
          setOpenCustomFilter(false);
          setCustomDateErrors({});
        }}
        errorStart={customDateErrors.startDate}
        errorEnd={customDateErrors.endDate}
      />
    </div>
  );
};

export default Payments;
