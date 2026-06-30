import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isAfter,
  isBefore,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { getFullName } from "@/mk/utils/string";
import { capitalizeWords } from "@/mk/utils/string";
import {
  RESERVATION_STATUS_CONFIG,
  ReservationStatus,
} from "@/modulos/Reservas/constants/reservationConstants";
import type {
  ReservationArea,
  ReservationListItem,
  ReservationResident,
  ReservationUnit,
  ReservationVisibleRange,
} from "@/modulos/Reservas/types";
import { resolveReservationDisplayStatus } from "@/modulos/Reservas/utils/reservationStatus";
import { getReservationDisplayStatusInput } from "@/modulos/Reservas/utils/reservationPayment";

const WEEK_STARTS_ON_SUNDAY = { weekStartsOn: 0 as const };

export const CALENDAR_WEEK_DAYS = [
  "DOM",
  "LUN",
  "MAR",
  "MIE",
  "JUE",
  "VIE",
  "SAB",
];

const FALLBACK_STATUS = {
  label: "Sin estado",
  backgroundColor: "#2A2D31",
  color: "#F5F7FA",
};

export type CalendarReservationEntry = {
  reservation: ReservationListItem;
  dayKey: string;
  areaName: string;
  residentName: string;
  unitLabel: string;
  timeLabel: string;
  chipLabel: string;
  status: ReservationStatus | number | undefined;
  statusLabel: string;
  backgroundColor: string;
  color: string;
  searchText: string;
  sortValue: number;
};

export type ReservationCalendarDayAvailability = {
  available: string[];
  unavailable: string[];
  maintenance: string[];
  reserved: boolean;
};

export type CalendarAreaAvailability = {
  areaId: string;
  areaName: string;
  bookingMode: string;
  isAvailable: boolean;
  slots: string[];
  source: "live" | "schedule";
  note: string;
};

const WEEKDAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export const normalizeSearchText = (value?: string | null) =>
  (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

export const formatDateKey = (date: Date) => format(date, "yyyy-MM-dd");

export const getWeekdayName = (date: Date) => WEEKDAY_NAMES[date.getDay()] || "Domingo";

export const getVisibleMonthRange = (
  anchorDate: Date,
): ReservationVisibleRange => ({
  start: startOfWeek(startOfMonth(anchorDate), WEEK_STARTS_ON_SUNDAY),
  end: endOfWeek(endOfMonth(anchorDate), WEEK_STARTS_ON_SUNDAY),
});

export const buildMonthGrid = (anchorDate: Date) =>
  eachDayOfInterval(getVisibleMonthRange(anchorDate));

export const splitRangeByYear = (
  start: Date,
  end: Date,
): ReservationVisibleRange[] => {
  const segments: ReservationVisibleRange[] = [];
  let year = start.getFullYear();

  while (year <= end.getFullYear()) {
    const startBoundary =
      year === start.getFullYear() ? start : new Date(year, 0, 1);
    const endBoundary =
      year === end.getFullYear() ? end : endOfYear(new Date(year, 0, 1));

    segments.push({ start: startBoundary, end: endBoundary });
    year += 1;
  }

  return segments;
};

export const dedupeReservationsById = (reservations: ReservationListItem[]) =>
  Array.from(
    new Map(
      reservations.map((reservation) => [String(reservation.id), reservation]),
    ).values(),
  );

export const getResidentFromUnit = (unit?: ReservationUnit | null) =>
  unit?.tenant || unit?.homeowner || unit?.titular?.owner || null;

export const getResidentName = (
  resident?: ReservationResident | null,
  fallback = "Residente no disponible",
) => {
  const fullName = getFullName({
    name: resident?.name || undefined,
    middle_name: resident?.middle_name || undefined,
    last_name: resident?.last_name || undefined,
    mother_last_name: resident?.mother_last_name || undefined,
  });

  return fullName || fallback;
};

export const getUnitLabel = (unit?: ReservationUnit | null) => {
  if (!unit) return "Sin unidad";

  const unitTypeLabel = capitalizeWords(
    String(unit.type?.name || unit.description || "Unidad").trim(),
  );
  const unitNumber = String(unit.nro || "").trim();

  return unitNumber ? `${unitTypeLabel} ${unitNumber}` : unitTypeLabel;
};

export const getAreaName = (area?: ReservationArea | null) =>
  capitalizeWords(area?.title?.trim() || "Area social");

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
    startTime: reservation.start_time || firstPeriod?.time_from || null,
    endTime: reservation.end_time || lastPeriod?.time_to || null,
  };
};

const normalizeTime = (time: string) => (time.length === 5 ? `${time}:00` : time);

const normalizeAvailabilitySlot = (value: string) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";

  const rangeMatch = trimmed.match(
    /^(\d{2}:\d{2})(?::\d{2})?\s*-\s*(\d{2}:\d{2})(?::\d{2})?$/,
  );

  if (rangeMatch) {
    return `${rangeMatch[1]} - ${rangeMatch[2]}`;
  }

  return trimmed;
};

const toNormalizedSlotList = (value: unknown) =>
  Array.isArray(value)
    ? value
        .map((item) => normalizeAvailabilitySlot(String(item || "")))
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right))
    : [];

const asPlainObject = (value: unknown): Record<string, any> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};

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

export const getReservationInterval = (reservation: ReservationListItem) => {
  if (!reservation.date_at) return null;

  const { startTime, endTime } = getTimeBounds(reservation);
  const endDate = reservation.date_end || reservation.date_at;

  if (!startTime && !endTime) {
    return {
      allDay: true,
      start: new Date(`${reservation.date_at}T00:00:00`),
      end: new Date(`${endDate}T23:59:59`),
    };
  }

  if (hasSyntheticFullDayTimes(startTime, endTime)) {
    return {
      allDay: true,
      start: new Date(`${reservation.date_at}T00:00:00`),
      end: new Date(`${endDate}T23:59:59`),
    };
  }

  const start = new Date(
    `${reservation.date_at}T${normalizeTime(startTime || "08:00:00")}`,
  );
  let end = new Date(
    `${endDate}T${normalizeTime(endTime || startTime || "09:00:00")}`,
  );

  if (end <= start) {
    end = new Date(start.getTime() + 60 * 60 * 1000);
  }

  return {
    allDay: false,
    start,
    end,
  };
};

export const formatReservationTimeRange = (reservation: ReservationListItem) => {
  const interval = getReservationInterval(reservation);
  if (!interval) return "Horario no definido";
  if (interval.allDay) return "Todo el dia";

  const { startTime, endTime } = getTimeBounds(reservation);
  const safeStart = (startTime || "00:00:00").slice(0, 5);
  const safeEnd = (endTime || startTime || "00:00:00").slice(0, 5);
  return `${safeStart} - ${safeEnd}`;
};

export const extractDayAvailabilityFromCalendarResponse = (
  payload: unknown,
  day: Date | string,
): ReservationCalendarDayAvailability => {
  const date = typeof day === "string" ? new Date(`${day}T00:00:00`) : day;
  const rawRoot = asPlainObject(payload);
  const nestedData = asPlainObject(rawRoot.data);
  const root =
    Object.keys(nestedData).length > 0 &&
    !rawRoot.days &&
    !rawRoot.available &&
    !rawRoot.unavailable
      ? nestedData
      : rawRoot;

  const days = asPlainObject(root.days);
  const dayNode = asPlainObject(days[String(date.getDate())]);
  const source = Object.keys(dayNode).length > 0 ? dayNode : root;
  const reservedDays = Array.isArray(root.reserved)
    ? root.reserved.map((item: unknown) => String(item))
    : [];

  return {
    available: toNormalizedSlotList(source.available),
    unavailable: toNormalizedSlotList(source.unavailable),
    maintenance: toNormalizedSlotList(source.maintenance),
    reserved: reservedDays.includes(formatDateKey(date)),
  };
};

export const buildAreaAvailabilitySnapshot = (
  area: ReservationArea,
  day: Date,
  liveAvailability?: ReservationCalendarDayAvailability,
): CalendarAreaAvailability => {
  const weekdayName = getWeekdayName(day);
  const configuredSlots = toNormalizedSlotList(area.available_hours?.[weekdayName]);
  const scheduledDays = Array.isArray(area.available_days) ? area.available_days : [];
  const isScheduledDay =
    scheduledDays.length > 0
      ? scheduledDays.includes(weekdayName)
      : configuredSlots.length > 0 || area.booking_mode !== "hour";
  const areaName = getAreaName(area);

  if (liveAvailability) {
    const normalizedLiveSlots = toNormalizedSlotList(liveAvailability.available);

    if (normalizedLiveSlots.length > 0) {
      return {
        areaId: String(area.id),
        areaName,
        bookingMode: String(area.booking_mode || "day"),
        isAvailable: true,
        slots: normalizedLiveSlots,
        source: "live",
        note: "Disponibilidad en tiempo real",
      };
    }

    if (
      area.booking_mode !== "hour" &&
      isScheduledDay &&
      !liveAvailability.reserved &&
      liveAvailability.unavailable.length === 0 &&
      liveAvailability.maintenance.length === 0
    ) {
      return {
        areaId: String(area.id),
        areaName,
        bookingMode: String(area.booking_mode || "day"),
        isAvailable: true,
        slots: configuredSlots.length > 0 ? configuredSlots : ["Todo el dia"],
        source: "schedule",
        note: "Disponibilidad configurada",
      };
    }

    return {
      areaId: String(area.id),
      areaName,
      bookingMode: String(area.booking_mode || "day"),
      isAvailable: false,
      slots: [],
      source: "live",
      note:
        liveAvailability.maintenance.length > 0
          ? "En mantenimiento"
          : liveAvailability.reserved
            ? "Ya tiene una reserva para esta fecha"
          : "Sin turnos disponibles",
    };
  }

  if (!isScheduledDay) {
    return {
      areaId: String(area.id),
      areaName,
      bookingMode: String(area.booking_mode || "day"),
      isAvailable: false,
      slots: [],
      source: "schedule",
      note: "No disponible este dia",
    };
  }

  if (area.booking_mode === "hour") {
    return {
      areaId: String(area.id),
      areaName,
      bookingMode: "hour",
      isAvailable: configuredSlots.length > 0,
      slots: configuredSlots,
      source: "schedule",
      note:
        configuredSlots.length > 0
          ? "Disponibilidad configurada"
          : "Sin turnos configurados",
    };
  }

  return {
    areaId: String(area.id),
    areaName,
    bookingMode: String(area.booking_mode || "day"),
    isAvailable: true,
    slots: configuredSlots.length > 0 ? configuredSlots : ["Todo el dia"],
    source: "schedule",
    note: "Disponibilidad configurada",
  };
};

export const getReservationStatusMeta = (reservation: ReservationListItem) => {
  const statusKey = resolveReservationDisplayStatus(
    getReservationDisplayStatusInput(reservation),
  );

  const config =
    (statusKey !== undefined && RESERVATION_STATUS_CONFIG[statusKey]) ||
    FALLBACK_STATUS;

  if (
    statusKey === ReservationStatus.CANCELLED_MANUAL ||
    statusKey === ReservationStatus.CANCELLED_AUTO
  ) {
    return {
      status: statusKey,
      ...config,
      backgroundColor: "#8C939C22",
      color: "#98A1AC",
    };
  }

  if (statusKey === ReservationStatus.MAINTENANCE) {
    return {
      status: statusKey,
      ...config,
      backgroundColor: "#FF3B3026",
      color: "#FF3B30",
    };
  }

  return {
    status: statusKey,
    ...config,
  };
};

export const matchesReservationFilters = (
  reservation: ReservationListItem,
  areaId: string,
  statuses: Array<ReservationStatus | number | string>,
  query: string,
) => {
  if (
    areaId !== "ALL" &&
    String(reservation.area?.id || reservation.area_id || "") !== areaId
  ) {
    return false;
  }

  const statusMeta = getReservationStatusMeta(reservation);
  const normalizedStatuses = statuses.map(String);
  if (
    normalizedStatuses.length > 0 &&
    !normalizedStatuses.includes("ALL") &&
    statusMeta.status !== undefined &&
    !normalizedStatuses.includes(String(statusMeta.status))
  ) {
    return false;
  }

  if (!query) return true;

  const resident = reservation.owner || getResidentFromUnit(reservation.dpto);
  const haystack = [
    reservation.id,
    getAreaName(reservation.area),
    getResidentName(
      resident,
      statusMeta.status === ReservationStatus.MAINTENANCE
        ? "Administracion"
        : "Residente no disponible",
    ),
    getUnitLabel(reservation.dpto),
    reservation.obs,
    reservation.reason,
    statusMeta.label,
    formatReservationTimeRange(reservation),
  ]
    .filter(Boolean)
    .join(" ");

  return normalizeSearchText(haystack).includes(query);
};

export const buildCalendarEntries = (
  reservations: ReservationListItem[],
  visibleStart: Date,
  visibleEnd: Date,
) => {
  const entries = new Map<string, CalendarReservationEntry[]>();

  reservations.forEach((reservation) => {
    const interval = getReservationInterval(reservation);
    if (!interval) return;

    if (isAfter(startOfDay(interval.start), visibleEnd)) return;
    if (isBefore(startOfDay(interval.end), startOfDay(visibleStart))) return;

    const start = isBefore(interval.start, visibleStart)
      ? visibleStart
      : interval.start;
    const end = isAfter(interval.end, visibleEnd) ? visibleEnd : interval.end;

    const areaName = getAreaName(reservation.area);
    const resident = reservation.owner || getResidentFromUnit(reservation.dpto);
    const statusMeta = getReservationStatusMeta(reservation);
    const residentName = getResidentName(
      resident,
      statusMeta.status === ReservationStatus.MAINTENANCE
        ? "Administracion"
        : "Residente no disponible",
    );
    const unitLabel = getUnitLabel(reservation.dpto);
    const timeLabel = formatReservationTimeRange(reservation);
    const chipLabel = `${areaName} ${timeLabel}`;

    eachDayOfInterval({
      start: startOfDay(start),
      end: startOfDay(end),
    }).forEach((day) => {
      const dayKey = formatDateKey(day);
      const list = entries.get(dayKey) || [];
      const sortValue =
        statusMeta.status === ReservationStatus.MAINTENANCE
          ? -1
          : Number.parseInt(
              (getTimeBounds(reservation).startTime || "23:59").replace(":", ""),
              10,
            );

      list.push({
        reservation,
        dayKey,
        areaName,
        residentName,
        unitLabel,
        timeLabel,
        chipLabel,
        status: statusMeta.status,
        statusLabel: statusMeta.label,
        backgroundColor: statusMeta.backgroundColor,
        color: statusMeta.color,
        searchText: normalizeSearchText(
          `${chipLabel} ${residentName} ${unitLabel} ${statusMeta.label}`,
        ),
        sortValue,
      });

      entries.set(dayKey, list);
    });
  });

  entries.forEach((list, key) => {
    entries.set(
      key,
      list.sort((left, right) => {
        if (left.sortValue !== right.sortValue) {
          return left.sortValue - right.sortValue;
        }

        return left.areaName.localeCompare(right.areaName);
      }),
    );
  });

  return entries;
};
