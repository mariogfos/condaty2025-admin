"use client";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import DateRangeFilterModal from "@/components/DateRangeFilterModal/DateRangeFilterModal";
import { IconCalendar } from "@/components/layout/icons/IconsBiblioteca";
import { RESERVATIONS_COPY } from "./config/reservas.constants";
import useReservas from "./hooks/useReservas";

/**
 * La lista de Reservas. **Presentacional**: los datos, los filtros y las
 * acciones vienen de `useReservas`.
 */
const Reserva = () => {
  const {
    List,
    userCan,
    modPermission,
    openCustomFilter,
    customDateErrors,
    onSaveCustomPeriod,
    onCloseCustomPeriod,
  } = useReservas();

  if (!userCan(modPermission, "R")) return <NotAccess />;

  return (
    <>
      <List
        height={"100%"}
        emptyMsg={RESERVATIONS_COPY.emptyMsg}
        emptyLine2={RESERVATIONS_COPY.emptyLine2}
        emptyIcon={<IconCalendar size={80} color="var(--cWhiteV1)" />}
        filterBreakPoint={1130}
      />
      <DateRangeFilterModal
        open={openCustomFilter}
        onClose={onCloseCustomPeriod}
        onSave={onSaveCustomPeriod}
        errorStart={customDateErrors.startDate}
        errorEnd={customDateErrors.endDate}
      />
    </>
  );
};

export default Reserva;
