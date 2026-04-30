import {
  createAllDayEvent,
  createTimedEvent,
  type CalendarType,
  type Event as DayFlowEvent,
} from "@dayflow/core";
import {
  addHours,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { formatBs } from "@/mk/utils/numbers";
import { getFullName } from "@/mk/utils/string";
import {
  RESERVATION_STATUS_CONFIG,
  getUpdatedReservationStatus,
  type ReservationStatus,
} from "@/modulos/Reservas/constants/reservationConstants";
import type {
  NewReservaResident,
  NewReservaUnit,
  ReservationCalendarKey,
  ReservationCalendarMeta,
  ReservationListItem,
  ReservationVisibleRange,
} from "./types";

export const RESERVATION_CALENDARS: CalendarType[] = [
  {
    id: "pending",
    name: "Pendientes",
    icon: "P",
    colors: {
      eventColor: "#E9B01E2B",
      eventSelectedColor: "#E9B01E45",
      lineColor: "#E9B01E",
      textColor: "#FFD977",
    },
    isVisible: true,
  },
  {
    id: "confirmed",
    name: "Reservadas",
    icon: "R",
    colors: {
      eventColor: "#00E38C26",
      eventSelectedColor: "#00E38C40",
      lineColor: "#00E38C",
      textColor: "#8AF5C9",
    },
    isVisible: true,
  },
  {
    id: "cancelled",
    name: "Canceladas",
    icon: "C",
    colors: {
      eventColor: "#E4605528",
      eventSelectedColor: "#E4605542",
      lineColor: "#E46055",
      textColor: "#FFBAB3",
    },
    isVisible: true,
  },
  {
    id: "maintenance",
    name: "Mantenimiento",
    icon: "M",
    colors: {
      eventColor: "#4285FA24",
      eventSelectedColor: "#4285FA3F",
      lineColor: "#4285FA",
      textColor: "#A7C6FF",
    },
    isVisible: true,
  },
];

export const normalizeSearchText = (value?: string | null) =>
  (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

export const formatDateKey = (date: Date) => format(date, "yyyy-MM-dd");

export const getResidentFromUnit = (unit?: NewReservaUnit | null) => {
  return unit?.tenant || unit?.homeowner || unit?.titular?.owner || null;
};

export const getResidentName = (resident?: NewReservaResident | null) => {
  const fullName = getFullName({
    name: resident?.name || undefined,
    middle_name: resident?.middle_name || undefined,
    last_name: resident?.last_name || undefined,
    mother_last_name: resident?.mother_last_name || undefined,
  });

  return fullName || "Residente no disponible";
};

export const getUnitLabel = (unit?: NewReservaUnit | null) => {
  if (!unit?.nro) return "Unidad sin asignar";
  return `Unidad ${unit.nro}`;
};

export const getAreaName = (reservation?: ReservationListItem | null) => {
  return reservation?.area?.title?.trim() || "Área social";
};

export const getReservationStatusMeta = (reservation?: ReservationListItem | null) => {
  const nextStatus = getUpdatedReservationStatus(
    reservation?.status as ReservationStatus | undefined,
    reservation?.date_end || undefined,
    reservation?.end_time || undefined,
  );

  if (!nextStatus) return null;
  return RESERVATION_STATUS_CONFIG[nextStatus];
};

export const getReservationCalendarKey = (
  status?: ReservationStatus | "X" | string | null,
): ReservationCalendarKey => {
  if (!status) return "pending";
  if (status === "M") return "maintenance";
  if (["R", "C", "T", "X"].includes(status)) return "cancelled";
  if (["N", "L", "F"].includes(status)) return "confirmed";
  return "pending";
};

const sortPeriods = (
  periods?: ReservationListItem["periods"],
): Array<{ time_from?: string | null; time_to?: string | null }> => {
  if (!Array.isArray(periods)) return [];
  return [...periods].sort((left, right) =>
    String(left?.time_from || "").localeCompare(String(right?.time_from || "")),
  );
};

const getTimeBounds = (reservation: ReservationListItem) => {
  const sortedPeriods = sortPeriods(reservation.periods);
  const firstPeriod = sortedPeriods[0];
  const lastPeriod = sortedPeriods[sortedPeriods.length - 1];

  return {
    startTime:
      reservation.start_time || firstPeriod?.time_from || null,
    endTime:
      reservation.end_time || lastPeriod?.time_to || null,
  };
};

const buildDateTime = (dateAt: string, timeAt: string) => {
  const safeTime = timeAt.length === 5 ? `${timeAt}:00` : timeAt;
  return new Date(`${dateAt}T${safeTime}`);
};

const hasSyntheticFullDayTimes = (
  startTime?: string | null,
  endTime?: string | null,
) => {
  const normalizedStart = (startTime || "").slice(0, 5);
  const normalizedEnd = (endTime || "").slice(0, 5);

  if (normalizedStart === "23:59" && normalizedEnd === "23:59") {
    return true;
  }

  return (
    (normalizedStart === "00:00" || normalizedStart === "00:01") &&
    (normalizedEnd === "23:59" || normalizedEnd === "23:58")
  );
};

const getReservationDateBounds = (reservation: ReservationListItem) => {
  if (!reservation.date_at) return null;

  const { startTime, endTime } = getTimeBounds(reservation);
  if (!startTime && !endTime) {
    return {
      allDay: true,
      start: new Date(`${reservation.date_at}T00:00:00`),
      end: new Date(`${reservation.date_at}T23:59:59`),
    };
  }

  if (hasSyntheticFullDayTimes(startTime, endTime)) {
    return {
      allDay: true,
      start: new Date(`${reservation.date_at}T00:00:00`),
      end: new Date(`${reservation.date_at}T23:59:59`),
    };
  }

  const start = buildDateTime(reservation.date_at, startTime || "08:00:00");
  let end = buildDateTime(
    reservation.date_at,
    endTime || startTime || "09:00:00",
  );

  if (end <= start) {
    end = addHours(start, 1);
  }

  return {
    allDay: false,
    start,
    end,
  };
};

export const formatReservationTimeRange = (
  reservation?: ReservationListItem | null,
) => {
  if (!reservation) return "Horario no definido";

  const { startTime, endTime } = getTimeBounds(reservation);
  if (!startTime && !endTime) return "Todo el día";

  const safeStart = (startTime || "00:00:00").slice(0, 5);
  const safeEnd = (endTime || startTime || "00:00:00").slice(0, 5);
  return `${safeStart} - ${safeEnd}`;
};

export const formatReservationDateLabel = (
  reservation?: ReservationListItem | null,
) => {
  if (!reservation?.date_at) return "Fecha pendiente";
  return format(new Date(`${reservation.date_at}T00:00:00`), "dd/MM/yyyy");
};

export const formatReservationAmount = (
  reservation?: ReservationListItem | null,
) => {
  const amount = Number(reservation?.amount ?? reservation?.area?.price ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) return "Gratis";
  return formatBs(amount);
};

export const getReservationMetaFromCalendarEvent = (
  event?: DayFlowEvent | null,
) => {
  return (event?.meta || null) as ReservationCalendarMeta | null;
};

export const getReservationFromCalendarEvent = (
  event?: DayFlowEvent | null,
) => {
  return getReservationMetaFromCalendarEvent(event)?.reservation || null;
};

export const mapReservationsToCalendarEvents = (
  reservations: ReservationListItem[],
) => {
  return reservations.reduce<DayFlowEvent[]>((events, reservation) => {
    const bounds = getReservationDateBounds(reservation);
    if (!bounds) return events;

    const statusMeta = getReservationStatusMeta(reservation);
    const statusKey = getReservationCalendarKey(reservation.status);
    const areaName = getAreaName(reservation);
    const residentName = getResidentName(
      reservation.owner || getResidentFromUnit(reservation.dpto),
    );
    const unitLabel = getUnitLabel(reservation.dpto);
    const dateKey = reservation.date_at || "";
    const statusLabel = statusMeta?.label || "Sin estado";
    const meta: ReservationCalendarMeta = {
      reservation,
      areaName,
      residentName,
      unitLabel,
      statusKey,
      statusLabel,
      dateKey,
      searchText: [
        areaName,
        residentName,
        unitLabel,
        reservation.obs,
        statusLabel,
      ]
        .filter(Boolean)
        .join(" "),
    };

    if (bounds.allDay) {
      events.push({
        ...createAllDayEvent(
          String(reservation.id),
          areaName,
          bounds.start,
          {
            calendarId: statusKey,
            meta,
          },
        ),
        description: `${unitLabel} · ${residentName}`,
      });
      return events;
    }

    events.push({
      ...createTimedEvent(
        String(reservation.id),
        areaName,
        bounds.start,
        bounds.end,
        {
          calendarId: statusKey,
          meta,
        },
      ),
      description: `${unitLabel} · ${residentName}`,
    });

    return events;
  }, []);
};

export const buildVisibleRangeSegments = (
  start: Date,
  end: Date,
): ReservationVisibleRange[] => {
  const segments: ReservationVisibleRange[] = [];
  let currentYear = start.getFullYear();

  while (currentYear <= end.getFullYear()) {
    const startBoundary =
      currentYear === start.getFullYear()
        ? start
        : startOfYear(new Date(currentYear, 0, 1));
    const endBoundary =
      currentYear === end.getFullYear()
        ? end
        : endOfYear(new Date(currentYear, 0, 1));

    segments.push({
      start: startBoundary,
      end: endBoundary,
    });

    currentYear += 1;
  }

  return segments;
};

export const getVisibleRangeForView = (
  date: Date,
  viewType: string,
): ReservationVisibleRange => {
  if (viewType === "day") {
    return {
      start: startOfDay(date),
      end: endOfDay(date),
    };
  }

  if (viewType === "week") {
    return {
      start: startOfWeek(date, { weekStartsOn: 1 }),
      end: endOfWeek(date, { weekStartsOn: 1 }),
    };
  }

  if (viewType === "year") {
    return {
      start: startOfYear(date),
      end: endOfYear(date),
    };
  }

  return {
    start: startOfWeek(startOfMonth(date), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(date), { weekStartsOn: 1 }),
  };
};

export const dedupeReservationsById = (
  reservations: ReservationListItem[],
) => {
  return Array.from(
    new Map(
      reservations.map((reservation) => [String(reservation.id), reservation]),
    ).values(),
  );
};
