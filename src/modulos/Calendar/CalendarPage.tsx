"use client";

import {
  startTransition,
  useCallback,
  useContext,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  addMonths,
  addDays,
  endOfDay,
  format,
  isSameMonth,
  isToday,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { CalendarPlus, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  IconArrowLeft,
  IconArrowRight,
  IconFilter,
} from "@/components/layout/icons/IconsBiblioteca";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import ReservationDetailModal from "@/modulos/Reservas/RenderView/RenderView";
import { AxiosContext } from "@/mk/contexts/AxiosInstanceProvider";
import { useAuth } from "@/mk/contexts/AuthProvider";
import Button from "@/mk/components/forms/Button/Button";
import DataSearch from "@/mk/components/forms/DataSearch/DataSearch";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import ContextMenu, {
  type ContextMenuItem,
  type ContextMenuPosition,
} from "@/mk/components/ui/ContextMenu";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { capitalize, capitalizeWords } from "@/mk/utils/string";
import { RESERVATION_STATUS_OPTIONS } from "@/modulos/Reservas/constants/reservationConstants";
import {
  formatReservationPaymentTimeLimitMessage,
  shouldShowReservationPaymentTimeLimit,
} from "@/modulos/Reservas/utils/reservationStatus";
import { getUrlImages } from "@/mk/utils/string";
import type {
  ReservationArea,
  ReservationExtraData,
  ReservationListItem,
  ReservationResident,
  ReservationUnit,
} from "@/modulos/Reservas/types";
import {
  CALENDAR_WEEK_DAYS,
  buildAreaAvailabilitySnapshot,
  buildCalendarEntries,
  buildMonthGrid,
  dedupeReservationsById,
  extractDayAvailabilityFromCalendarResponse,
  formatDateKey,
  getResidentName,
  getReservationStatusMeta,
  getUnitLabel,
  getVisibleMonthRange,
  matchesReservationFilters,
  normalizeSearchText,
  splitRangeByYear,
} from "./helpers";
import styles from "./CalendarPage.module.css";

const DEFAULT_DAY_ENTRY_SLOTS = 3;
const DAY_ENTRY_ROW_HEIGHT = 24;
const DAY_CELL_CONTENT_OFFSET = 44;

const FILTER_INPUT_STYLE = {
  height: 44,
  backgroundColor: "var(--cTableHeader)",
  border: "1px solid var(--cTableBorder)",
  borderRadius: 12,
  padding: "16px",
  fontSize: 15,
  fontWeight: 600,
  color: "var(--cWhite)",
};

const FILTER_STYLE = {
  width: "100%",
  minWidth: "100%",
  height: 44,
  border: "none",
  backgroundColor: "transparent",
};

const PAST_PERIOD_MONTHS = 12;
const UPCOMING_PERIOD_MONTHS = 6;
const DEFAULT_VISIBLE_STATUS_IDS = RESERVATION_STATUS_OPTIONS.map((option) =>
  String(option.id),
).filter(
  (statusId) =>
    statusId !== "ALL" &&
    statusId !== "R" &&
    statusId !== "C" &&
    statusId !== "T" &&
    statusId !== "X",
);
const STATUS_WITH_REASON = new Set(["M", "C", "T", "R", "X"]);
const DEFAULT_PERIOD_ID = format(startOfMonth(new Date()), "yyyy-MM");
const DEFAULT_STATUS_FILTER_KEY = [...DEFAULT_VISIBLE_STATUS_IDS]
  .sort()
  .join(",");
const CALENDAR_FLOW_TOTAL_STEPS = 2;
const NON_BLOCKING_CALENDAR_STATUSES = new Set(["C", "T", "R", "X"]);

type CalendarDayActionRow = {
  day: Date;
  dayKey: string;
  reservationCount: number;
};

type DayActionMenuState = {
  row: CalendarDayActionRow;
  position: ContextMenuPosition;
};

type CalendarActionModalState = {
  action: "create_reservation" | "maintenance";
  row: CalendarDayActionRow;
};

type ReservationDraft = {
  areaId: string;
  unitOptionId: string;
  slot: string;
  note: string;
};

type MaintenanceDraft = {
  areaId: string;
  scope: "day" | "range";
  endDate: string;
  reason: string;
};

type CalendarAreaChoice = {
  area: ReservationArea;
  areaId: string;
  areaName: string;
  bookingMode: "hour" | "day";
  slots: string[];
  helperText: string;
  isSelectable: boolean;
};

type CalendarAreaLocalAvailability = {
  hasReservations: boolean;
  hasMaintenance: boolean;
  hasAllDayReservation: boolean;
  hasAllDayMaintenance: boolean;
  reservedSlots: string[];
  maintenanceSlots: string[];
};

type CalendarAreaLocalAvailabilityLookup = {
  byId: Record<string, CalendarAreaLocalAvailability>;
  byName: Record<string, CalendarAreaLocalAvailability>;
};

type CalendarUnitChoice = {
  id: string;
  name: string;
  unit: ReservationUnit;
  resident: ReservationResident | null;
  roleLabel: string;
};

const buildCalendarUnitChoices = (unit: ReservationUnit): CalendarUnitChoice[] => {
  const unitLabel = getUnitLabel(unit);
  const seenResidents = new Set<string>();
  const choices: CalendarUnitChoice[] = [];

  const pushChoice = (
    resident: ReservationResident | null | undefined,
    roleLabel: string,
    fallbackKey: string,
  ) => {
    if (!resident) return;

    const residentName = getResidentName(resident, roleLabel);
    const dedupeKey = String(resident.id || residentName || fallbackKey);

    if (seenResidents.has(dedupeKey)) {
      return;
    }

    seenResidents.add(dedupeKey);
    choices.push({
      id: `${unit.id}:${fallbackKey}:${resident.id || residentName}`,
      name: `${unitLabel}: ${residentName} · ${roleLabel}`,
      unit,
      resident,
      roleLabel,
    });
  };

  pushChoice(unit.tenant, "Inquilino", "tenant");
  pushChoice(unit.homeowner, "Propietario", "homeowner");
  pushChoice(unit.titular?.owner, "Titular", "titular");

  const homeownerDependents = Array.isArray(unit.homeowner?.dependientes)
    ? unit.homeowner.dependientes
    : [];
  homeownerDependents.forEach((dependent, index) => {
    pushChoice(
      dependent?.owner,
      "Dependiente de propietario",
      `homeowner-dependent-${dependent?.owner_id || index}`,
    );
  });

  const tenantDependents = Array.isArray(unit.tenant?.dependientes)
    ? unit.tenant.dependientes
    : [];
  tenantDependents.forEach((dependent, index) => {
    pushChoice(
      dependent?.owner,
      "Dependiente de inquilino",
      `tenant-dependent-${dependent?.owner_id || index}`,
    );
  });

  if (choices.length > 0) {
    return choices;
  }

  return [
    {
      id: `${unit.id}:unit`,
      name: `${unitLabel}: Sin residente`,
      unit,
      resident: null,
      roleLabel: "Sin residente",
    },
  ];
};

const CalendarPage = () => {
  const router = useRouter();
  const { contextInstance } = useContext(AxiosContext);
  const { showToast, userCan } = useAuth();

  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedAreaId, setSelectedAreaId] = useState("ALL");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(
    DEFAULT_VISIBLE_STATUS_IDS,
  );
  const [searchText, setSearchText] = useState("");
  const [areas, setAreas] = useState<ReservationArea[]>([]);
  const [units, setUnits] = useState<ReservationUnit[]>([]);
  const [reservations, setReservations] = useState<ReservationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detailItem, setDetailItem] = useState<ReservationListItem | null>(null);
  const [dayEntrySlots, setDayEntrySlots] = useState(DEFAULT_DAY_ENTRY_SLOTS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dayActionMenu, setDayActionMenu] = useState<DayActionMenuState | null>(
    null,
  );
  const [calendarActionModal, setCalendarActionModal] =
    useState<CalendarActionModalState | null>(null);
  const [reservationStep, setReservationStep] = useState(0);
  const [reservationDraft, setReservationDraft] = useState<ReservationDraft>({
    areaId: "",
    unitOptionId: "",
    slot: "",
    note: "",
  });
  const [reservationAvailabilityLoading, setReservationAvailabilityLoading] =
    useState(false);
  const [reservationAvailabilityMessage, setReservationAvailabilityMessage] =
    useState("");
  const [reservationLiveCanBook, setReservationLiveCanBook] = useState<
    boolean | null
  >(null);
  const [reservationLiveAvailability, setReservationLiveAvailability] =
    useState<ReturnType<typeof extractDayAvailabilityFromCalendarResponse> | null>(
      null,
    );
  const [modalAreaLiveAvailabilityMap, setModalAreaLiveAvailabilityMap] =
    useState<
      Record<
        string,
        ReturnType<typeof extractDayAvailabilityFromCalendarResponse> | null
      >
    >({});
  const [modalAreaAvailabilityLoading, setModalAreaAvailabilityLoading] =
    useState(false);
  const [reservationSubmitting, setReservationSubmitting] = useState(false);
  const [selectedDayTimeLimits, setSelectedDayTimeLimits] = useState<
    Record<string, string>
  >({});
  const [maintenanceStep, setMaintenanceStep] = useState(0);
  const [maintenanceDraft, setMaintenanceDraft] = useState<MaintenanceDraft>({
    areaId: "",
    scope: "day",
    endDate: "",
    reason: "",
  });

  const deferredSearch = useDeferredValue(searchText);
  const requestKeyRef = useRef("");
  const hasLoadedAreasRef = useRef(false);
  const reservationAvailabilityRequestRef = useRef(0);
  const modalAreaAvailabilityRequestRef = useRef(0);
  const selectedDayTimeLimitRequestRef = useRef(0);
  const gridRef = useRef<HTMLDivElement>(null);

  const canView = userCan("reservations", "R");
  const canCreate = userCan("reservations", "C");

  const monthDays = useMemo(() => buildMonthGrid(currentMonth), [currentMonth]);
  const visibleRange = useMemo(
    () => getVisibleMonthRange(currentMonth),
    [currentMonth],
  );
  const calendarRowCount = Math.ceil(monthDays.length / 7);

  const loadAreas = useCallback(async () => {
    if (!contextInstance) return;

    try {
      const response = await contextInstance.request({
        method: "GET",
        url: "/reservations",
        params: {
          fullType: "EXTRA",
          page: 1,
          perPage: -1,
        },
      });

      const extraData = (response?.data?.data || {}) as ReservationExtraData;
      setAreas(Array.isArray(extraData.areas) ? extraData.areas : []);
      setUnits(Array.isArray(extraData.dptos) ? extraData.dptos : []);
    } catch (_error) {
      setAreas([]);
      setUnits([]);
      showToast("No pudimos cargar las areas del calendario", "error");
    }
  }, [contextInstance, showToast]);

  const loadReservations = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!contextInstance) return;

      const requestKey = `${formatDateKey(visibleRange.start)}:${formatDateKey(
        visibleRange.end,
      )}`;
      requestKeyRef.current = requestKey;

      if (options?.silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const responses = await Promise.all(
          splitRangeByYear(visibleRange.start, visibleRange.end).map((segment) =>
            contextInstance.request({
              method: "GET",
              url: "/reservations",
              params: {
                fullType: "L",
                page: 1,
                perPage: 1000,
                filterBy: `date_at:${formatDateKey(segment.start)},${formatDateKey(
                  segment.end,
                )}`,
              },
            }),
          ),
        );

        if (requestKeyRef.current !== requestKey) return;

        const merged = dedupeReservationsById(
          responses.flatMap((response) =>
            Array.isArray(response?.data?.data) ? response.data.data : [],
          ),
        );

        setReservations(merged);
      } catch (_error) {
        if (requestKeyRef.current !== requestKey) return;
        setReservations([]);
        showToast("No pudimos cargar el calendario de reservas", "error");
      } finally {
        if (requestKeyRef.current === requestKey) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [contextInstance, showToast, visibleRange.end, visibleRange.start],
  );

  useEffect(() => {
    if (!contextInstance || !canView) return;

    void loadReservations();
    if (!hasLoadedAreasRef.current) {
      hasLoadedAreasRef.current = true;
      void loadAreas();
    }
  }, [canView, contextInstance, loadAreas, loadReservations]);

  useEffect(() => {
    setSelectedDate((current) => {
      if (
        current &&
        isWithinInterval(current, {
          start: visibleRange.start,
          end: endOfDay(visibleRange.end),
        })
      ) {
        return current;
      }

      const today = new Date();
      if (isSameMonth(today, currentMonth)) {
        return today;
      }

      return startOfMonth(currentMonth);
    });
  }, [currentMonth, visibleRange.end, visibleRange.start]);

  const normalizedQuery = useMemo(
    () => normalizeSearchText(deferredSearch),
    [deferredSearch],
  );

  const filteredReservations = useMemo(
    () =>
      reservations.filter((reservation) =>
        matchesReservationFilters(
          reservation,
          selectedAreaId,
          selectedStatuses,
          normalizedQuery,
        ),
      ),
    [normalizedQuery, reservations, selectedAreaId, selectedStatuses],
  );

  const blockingReservations = useMemo(
    () =>
      reservations.filter((reservation) => {
        const nextStatus = getReservationStatusMeta(reservation).status;
        return !NON_BLOCKING_CALENDAR_STATUSES.has(nextStatus);
      }),
    [reservations],
  );

  const entriesByDay = useMemo(
    () =>
      buildCalendarEntries(
        filteredReservations,
        visibleRange.start,
        visibleRange.end,
      ),
    [filteredReservations, visibleRange.end, visibleRange.start],
  );

  const blockingEntriesByDay = useMemo(
    () =>
      buildCalendarEntries(
        blockingReservations,
        visibleRange.start,
        visibleRange.end,
      ),
    [blockingReservations, visibleRange.end, visibleRange.start],
  );

  const selectedDayKey = selectedDate ? formatDateKey(selectedDate) : "";
  const selectedDayEntries = selectedDayKey
    ? entriesByDay.get(selectedDayKey) || []
    : [];

  useEffect(() => {
    if (!contextInstance || selectedDayEntries.length === 0) {
      setSelectedDayTimeLimits({});
      return;
    }

    const pendingEntries = selectedDayEntries.filter((entry) =>
      shouldShowReservationPaymentTimeLimit(entry.status),
    );

    if (pendingEntries.length === 0) {
      setSelectedDayTimeLimits({});
      return;
    }

    const requestId = selectedDayTimeLimitRequestRef.current + 1;
    selectedDayTimeLimitRequestRef.current = requestId;
    let cancelled = false;

    const loadTimeLimits = async () => {
      try {
        const responses = await Promise.all(
          pendingEntries.map((entry) =>
            contextInstance.request({
              method: "GET",
              url: "/reservations",
              params: {
                fullType: "DET",
                searchBy: entry.reservation.id,
                page: 1,
                perPage: 1,
              },
            }),
          ),
        );

        if (cancelled || selectedDayTimeLimitRequestRef.current !== requestId) {
          return;
        }

        const nextMap = pendingEntries.reduce<Record<string, string>>(
          (accumulator, entry, index) => {
            const rawTimeLimit = responses[index]?.data?.data?.timeLimit;
            const formatted = formatReservationPaymentTimeLimitMessage(rawTimeLimit);

            if (formatted) {
              accumulator[String(entry.reservation.id)] = formatted;
            }

            return accumulator;
          },
          {},
        );

        setSelectedDayTimeLimits(nextMap);
      } catch (_error) {
        if (!cancelled && selectedDayTimeLimitRequestRef.current === requestId) {
          setSelectedDayTimeLimits({});
        }
      }
    };

    void loadTimeLimits();

    return () => {
      cancelled = true;
    };
  }, [contextInstance, selectedDayEntries]);

  const visibleAreaOptions = useMemo(() => {
    const areaMap = new Map<string, ReservationArea>();

    areas.forEach((area) => {
      areaMap.set(String(area.id), area);
    });

    reservations.forEach((reservation) => {
      const id = String(reservation.area?.id || reservation.area_id || "");
      if (!id) return;

      if (!areaMap.has(id)) {
        areaMap.set(id, {
          id,
          title: reservation.area?.title || `Area ${id}`,
        });
      }
    });

    return [...areaMap.values()].sort((left, right) =>
      String(left.title || "").localeCompare(String(right.title || "")),
    );
  }, [areas, reservations]);

  const periodOptions = useMemo(() => {
    const todayMonth = startOfMonth(new Date());
    const upcomingOptions = new Map<string, { id: string; name: string }>();
    const previousOptions = new Map<string, { id: string; name: string }>();
    const buildOption = (date: Date) => ({
      id: format(date, "yyyy-MM"),
      name: capitalize(format(date, "MMMM yyyy", { locale: es })),
    });

    Array.from({ length: UPCOMING_PERIOD_MONTHS + 1 }, (_, index) =>
      startOfMonth(addMonths(todayMonth, index)),
    ).forEach((date) => {
      const option = buildOption(date);
      upcomingOptions.set(option.id, option);
    });

    Array.from({ length: PAST_PERIOD_MONTHS }, (_, index) =>
      startOfMonth(subMonths(todayMonth, index + 1)),
    ).forEach((date) => {
      const option = buildOption(date);
      previousOptions.set(option.id, option);
    });

    const currentMonthOption = buildOption(currentMonth);
    if (currentMonth >= todayMonth) {
      upcomingOptions.set(currentMonthOption.id, currentMonthOption);
    } else {
      previousOptions.set(currentMonthOption.id, currentMonthOption);
    }

    return [
      {
        id: "__group_current_upcoming",
        name: "Mes actual y próximos",
        isGroupLabel: true,
      },
      ...[...upcomingOptions.values()].sort((left, right) =>
        left.id.localeCompare(right.id),
      ),
      {
        id: "__group_previous",
        name: "Meses anteriores",
        isGroupLabel: true,
      },
      ...[...previousOptions.values()].sort((left, right) =>
        right.id.localeCompare(left.id),
      ),
    ];
  }, [currentMonth]);

  const areaOptions = useMemo(
    () => [
      { id: "ALL", name: "Todas las áreas" },
      ...visibleAreaOptions.map((area) => ({
        id: String(area.id),
        name: capitalizeWords(area.title || `Área ${area.id}`),
      })),
    ],
    [visibleAreaOptions],
  );

  const unitOptions = useMemo<CalendarUnitChoice[]>(
    () => units.flatMap((unit) => buildCalendarUnitChoices(unit)),
    [units],
  );

  const calendarAreas = useMemo(
    () =>
      visibleAreaOptions.map(
        (area) =>
          areas.find((candidate) => String(candidate.id) === String(area.id)) || area,
      ),
    [areas, visibleAreaOptions],
  );

  const activeStatusFilterKey = useMemo(
    () => [...selectedStatuses].sort().join(","),
    [selectedStatuses],
  );

  const hasCompactFiltersApplied = useMemo(
    () =>
      format(currentMonth, "yyyy-MM") !== DEFAULT_PERIOD_ID ||
      selectedAreaId !== "ALL" ||
      activeStatusFilterKey !== DEFAULT_STATUS_FILTER_KEY,
    [activeStatusFilterKey, currentMonth, selectedAreaId],
  );

  const formatDayLabel = useCallback(
    (date: Date) =>
      capitalize(format(date, "EEEE d 'de' MMMM yyyy", { locale: es })),
    [],
  );

  const selectedDayLabel = useMemo(() => {
    if (!selectedDate) return "Selecciona un dia";
    return formatDayLabel(selectedDate);
  }, [formatDayLabel, selectedDate]);

  const calendarActionModalDayKey = calendarActionModal?.row.dayKey || "";
  const calendarActionModalDayLabel = useMemo(
    () =>
      calendarActionModal ? formatDayLabel(calendarActionModal.row.day) : "",
    [calendarActionModal, formatDayLabel],
  );
  const minimumActionDate = useMemo(
    () => format(addDays(startOfDay(new Date()), 1), "yyyy-MM-dd"),
    [],
  );

  const formatSlotLabel = useCallback((slot?: string | null) => {
    const trimmed = String(slot || "").trim();
    if (!trimmed) return "";

    const rangeMatch = trimmed.match(
      /^(\d{2}:\d{2})(?::\d{2})?\s*-\s*(\d{2}:\d{2})(?::\d{2})?$/,
    );

    if (rangeMatch) {
      return `${rangeMatch[1]} - ${rangeMatch[2]}`;
    }

    return trimmed.replace(/\s*-\s*/, " - ");
  }, []);

  const resolveAreaChoice = useCallback(
    (area: ReservationArea, date: Date): CalendarAreaChoice => {
      const normalizedWeekday = normalizeSearchText(format(date, "EEEE", { locale: es }));
      const availableDays = Array.isArray(area.available_days)
        ? area.available_days
        : [];
      const dayEnabled =
        availableDays.length === 0 ||
        availableDays.some(
          (dayValue) => normalizeSearchText(dayValue) === normalizedWeekday,
        );
      const matchingHoursKey = Object.keys(area.available_hours || {}).find(
        (dayKey) => normalizeSearchText(dayKey) === normalizedWeekday,
      );
      const slots = Array.isArray(
        matchingHoursKey ? area.available_hours?.[matchingHoursKey] : [],
      )
        ? (matchingHoursKey ? area.available_hours?.[matchingHoursKey] : []) || []
        : [];
      const bookingMode = area.booking_mode === "day" ? "day" : "hour";
      const normalizedSlots = slots
        .map((slot) => formatSlotLabel(slot))
        .filter(Boolean);

      if (!dayEnabled) {
        return {
          area,
          areaId: String(area.id),
          areaName: capitalizeWords(area.title || `Área ${area.id}`),
          bookingMode,
          slots: normalizedSlots,
          helperText: "No disponible para este día",
          isSelectable: false,
        };
      }

      if (bookingMode === "day") {
        return {
          area,
          areaId: String(area.id),
          areaName: capitalizeWords(area.title || `Área ${area.id}`),
          bookingMode,
          slots: ["Todo el día"],
          helperText: "",
          isSelectable: true,
        };
      }

      if (normalizedSlots.length === 0) {
        return {
          area,
          areaId: String(area.id),
          areaName: capitalizeWords(area.title || `Área ${area.id}`),
          bookingMode,
          slots: [],
          helperText: "Sin turnos configurados",
          isSelectable: false,
        };
      }

      return {
        area,
        areaId: String(area.id),
        areaName: capitalizeWords(area.title || `Área ${area.id}`),
        bookingMode,
        slots: normalizedSlots,
        helperText: "",
        isSelectable: true,
      };
    },
    [formatSlotLabel],
  );

  const modalAreaLocalAvailabilityLookup = useMemo<CalendarAreaLocalAvailabilityLookup>(() => {
    if (!calendarActionModal) {
      return { byId: {}, byName: {} };
    }

    const dayEntries =
      blockingEntriesByDay.get(calendarActionModal.row.dayKey) || [];
    const nextMapById = new Map<
      string,
      {
        hasReservations: boolean;
        hasMaintenance: boolean;
        hasAllDayReservation: boolean;
        hasAllDayMaintenance: boolean;
        reservedSlots: Set<string>;
        maintenanceSlots: Set<string>;
      }
    >();
    const nextMapByName = new Map<
      string,
      {
        hasReservations: boolean;
        hasMaintenance: boolean;
        hasAllDayReservation: boolean;
        hasAllDayMaintenance: boolean;
        reservedSlots: Set<string>;
        maintenanceSlots: Set<string>;
      }
    >();

    const getOrCreateAvailability = (
      targetMap: typeof nextMapById,
      key: string,
    ) =>
      targetMap.get(key) || {
        hasReservations: false,
        hasMaintenance: false,
        hasAllDayReservation: false,
        hasAllDayMaintenance: false,
        reservedSlots: new Set<string>(),
        maintenanceSlots: new Set<string>(),
      };

    dayEntries.forEach((entry) => {
      const areaId = String(entry.reservation.area?.id || entry.reservation.area_id || "");
      const areaNameKey = normalizeSearchText(
        entry.areaName || entry.reservation.area?.title || "",
      );

      const normalizedTimeLabel = normalizeSearchText(entry.timeLabel);
      const isAllDayEntry = normalizedTimeLabel === "todo el dia";
      const normalizedSlot = !isAllDayEntry ? formatSlotLabel(entry.timeLabel) : "";

      const applyEntry = (
        current: ReturnType<typeof getOrCreateAvailability>,
      ) => {
        if (entry.status === "M") {
          current.hasMaintenance = true;

          if (isAllDayEntry) {
            current.hasAllDayMaintenance = true;
          } else if (normalizedSlot) {
            current.maintenanceSlots.add(normalizedSlot);
          }
        } else {
          current.hasReservations = true;

          if (isAllDayEntry) {
            current.hasAllDayReservation = true;
          } else if (normalizedSlot) {
            current.reservedSlots.add(normalizedSlot);
          }
        }
      };

      if (areaId) {
        const currentById = getOrCreateAvailability(nextMapById, areaId);
        applyEntry(currentById);
        nextMapById.set(areaId, currentById);
      }

      if (areaNameKey) {
        const currentByName = getOrCreateAvailability(nextMapByName, areaNameKey);
        applyEntry(currentByName);
        nextMapByName.set(areaNameKey, currentByName);
      }
    });

    const serializeAvailabilityMap = (sourceMap: typeof nextMapById) =>
      Object.fromEntries(
        [...sourceMap.entries()].map(([key, availability]) => [
          key,
          {
            hasReservations: availability.hasReservations,
            hasMaintenance: availability.hasMaintenance,
            hasAllDayReservation: availability.hasAllDayReservation,
            hasAllDayMaintenance: availability.hasAllDayMaintenance,
            reservedSlots: [...availability.reservedSlots],
            maintenanceSlots: [...availability.maintenanceSlots],
          } satisfies CalendarAreaLocalAvailability,
        ]),
      ) as Record<string, CalendarAreaLocalAvailability>;

    return {
      byId: serializeAvailabilityMap(nextMapById),
      byName: serializeAvailabilityMap(nextMapByName),
    };
  }, [blockingEntriesByDay, calendarActionModal, formatSlotLabel]);

  const getModalAreaLocalAvailability = useCallback(
    (choice: CalendarAreaChoice) =>
      modalAreaLocalAvailabilityLookup.byId[choice.areaId] ||
      modalAreaLocalAvailabilityLookup.byName[
        normalizeSearchText(choice.areaName)
      ] ||
      undefined,
    [modalAreaLocalAvailabilityLookup],
  );

  const buildMergedModalAvailability = useCallback(
    (
      choice: CalendarAreaChoice,
      liveAvailability: ReturnType<typeof extractDayAvailabilityFromCalendarResponse> | null,
      localAvailability?: CalendarAreaLocalAvailability,
    ) => {
      if (!liveAvailability && !localAvailability) return null;

      const uniq = (values: string[]) => [...new Set(values.filter(Boolean))];
      const reservedSlots = uniq([
        ...(liveAvailability?.unavailable || []),
        ...(localAvailability?.hasAllDayReservation ? choice.slots : []),
        ...(localAvailability?.reservedSlots || []),
      ]);
      const maintenanceSlots = uniq([
        ...(liveAvailability?.maintenance || []),
        ...(localAvailability?.hasAllDayMaintenance ? choice.slots : []),
        ...(localAvailability?.maintenanceSlots || []),
      ]);
      const availableSlots = uniq(
        (liveAvailability
          ? liveAvailability.available
          : choice.bookingMode === "hour"
            ? choice.slots
            : []
        ).filter(
          (slot) =>
            !reservedSlots.includes(slot) && !maintenanceSlots.includes(slot),
        ),
      );

      return {
        available: availableSlots,
        unavailable: reservedSlots,
        maintenance: maintenanceSlots,
        reserved:
          Boolean(liveAvailability?.reserved) ||
          Boolean(localAvailability?.hasAllDayReservation) ||
          (choice.bookingMode === "day" &&
            Boolean(localAvailability?.hasReservations)),
      };
    },
    [],
  );

  const modalAreaChoices = useMemo(() => {
    if (!calendarActionModal) return [];

    return calendarAreas.map((area) => {
      const scheduledChoice = resolveAreaChoice(area, calendarActionModal.row.day);
      const localAvailability = getModalAreaLocalAvailability(scheduledChoice);
      const liveAvailability = modalAreaLiveAvailabilityMap[String(area.id)] || null;
      const mergedAvailability = buildMergedModalAvailability(
        scheduledChoice,
        liveAvailability,
        localAvailability,
      );

      if (!mergedAvailability) {
        return scheduledChoice;
      }

      const liveSnapshot = buildAreaAvailabilitySnapshot(
        area,
        calendarActionModal.row.day,
        mergedAvailability,
      );

      if (!scheduledChoice.isSelectable) {
        return {
          ...scheduledChoice,
          helperText: scheduledChoice.helperText || liveSnapshot.note,
        };
      }

      const hasLocalMaintenance =
        Boolean(localAvailability?.hasMaintenance) ||
        Boolean(localAvailability?.hasAllDayMaintenance);
      const hasLocalReservation =
        Boolean(localAvailability?.hasReservations) ||
        Boolean(localAvailability?.hasAllDayReservation);

      if (hasLocalMaintenance || mergedAvailability.maintenance.length > 0) {
        return {
          ...scheduledChoice,
          slots: [],
          helperText: "En mantenimiento",
          isSelectable: false,
        };
      }

      if (calendarActionModal.action === "maintenance") {
        const hasReservations =
          hasLocalReservation ||
          mergedAvailability.reserved ||
          mergedAvailability.unavailable.length > 0;

        if (hasReservations) {
          return {
            ...scheduledChoice,
            slots: [],
            helperText: "Ya tiene reservas para esta fecha",
            isSelectable: false,
          };
        }
      }

      if (
        calendarActionModal.action === "create_reservation" &&
        scheduledChoice.bookingMode === "day" &&
        (hasLocalReservation ||
          mergedAvailability.reserved ||
          mergedAvailability.unavailable.length > 0)
      ) {
        return {
          ...scheduledChoice,
          slots: [],
          helperText: "Ya tiene una reserva para esta fecha",
          isSelectable: false,
        };
      }

      return {
        ...scheduledChoice,
        slots: liveSnapshot.slots,
        helperText: liveSnapshot.isAvailable ? "" : liveSnapshot.note,
        isSelectable: liveSnapshot.isAvailable,
      };
    });
  }, [
    buildMergedModalAvailability,
    calendarActionModal,
    calendarAreas,
    getModalAreaLocalAvailability,
    modalAreaLiveAvailabilityMap,
    resolveAreaChoice,
  ]);


  const getReservationAreaMeta = useCallback((choice: CalendarAreaChoice) => {
    const availabilityLabel = !choice.isSelectable
      ? choice.helperText || "No disponible"
      : choice.bookingMode === "day"
        ? "Disponible"
        : "Turnos disponibles";
    const capacityLabel = choice.area.max_capacity
      ? `Máx. ${choice.area.max_capacity}`
      : "";

    return [availabilityLabel, capacityLabel].filter(Boolean).join(" · ");
  }, []);

  const selectedReservationUnitChoice = useMemo(
    () =>
      unitOptions.find((option) => option.id === reservationDraft.unitOptionId) ||
      null,
    [reservationDraft.unitOptionId, unitOptions],
  );

  const selectedReservationUnit = selectedReservationUnitChoice?.unit || null;

  const unwrapReservationCalendarPayload = useCallback((payload: unknown) => {
    const root =
      payload && typeof payload === "object" && !Array.isArray(payload)
        ? (payload as Record<string, any>)
        : {};
    const nestedData =
      root.data && typeof root.data === "object" && !Array.isArray(root.data)
        ? (root.data as Record<string, any>)
        : {};

    return Object.keys(nestedData).length > 0 &&
      !root.days &&
      !root.available &&
      !root.unavailable
      ? nestedData
      : root;
  }, []);

  useEffect(() => {
    if (!calendarActionModal) return;

    if (calendarActionModal.action === "create_reservation") {
      setReservationStep(0);
      setReservationDraft({
        areaId: "",
        unitOptionId: "",
        slot: "",
        note: "",
      });
      setReservationAvailabilityMessage("");
      setReservationLiveCanBook(null);
      setReservationLiveAvailability(null);
      setModalAreaLiveAvailabilityMap({});
      setModalAreaAvailabilityLoading(false);
      return;
    }

    setMaintenanceStep(0);
    setMaintenanceDraft({
      areaId: "",
      scope: "day",
      endDate: calendarActionModal.row.dayKey,
      reason: "",
    });
    setModalAreaLiveAvailabilityMap({});
    setModalAreaAvailabilityLoading(false);
  }, [calendarActionModal]);

  const selectedReservationAreaChoice = useMemo(
    () =>
      modalAreaChoices.find((choice) => choice.areaId === reservationDraft.areaId) ||
      null,
    [modalAreaChoices, reservationDraft.areaId],
  );

  const selectedMaintenanceAreaChoice = useMemo(
    () =>
      modalAreaChoices.find((choice) => choice.areaId === maintenanceDraft.areaId) ||
      null,
    [maintenanceDraft.areaId, modalAreaChoices],
  );

  const selectedReservationAreaAvailability = useMemo(() => {
    if (!calendarActionModal || !selectedReservationAreaChoice) return null;

    return buildAreaAvailabilitySnapshot(
      selectedReservationAreaChoice.area,
      calendarActionModal.row.day,
      reservationLiveAvailability ||
        modalAreaLiveAvailabilityMap[selectedReservationAreaChoice.areaId] ||
        undefined,
    );
  }, [
    calendarActionModal,
    modalAreaLiveAvailabilityMap,
    reservationLiveAvailability,
    selectedReservationAreaChoice,
  ]);

  const reservationBlockedSlots = reservationLiveAvailability?.unavailable || [];
  const reservationMaintenanceSlots = reservationLiveAvailability?.maintenance || [];

  const selectedReservationOwnerId = String(
    selectedReservationUnit?.titular?.id || "",
  );

  const selectedReservationResidentLabel = useMemo(() => {
    if (!selectedReservationUnitChoice) {
      return "Sin responsable";
    }

    if (!selectedReservationUnitChoice.resident) {
      return selectedReservationUnitChoice.roleLabel;
    }

    return `${getResidentName(selectedReservationUnitChoice.resident)} · ${selectedReservationUnitChoice.roleLabel}`;
  }, [selectedReservationUnitChoice]);

  const reservationIsFree =
    selectedReservationAreaChoice?.area.is_free === "A" ||
    Number(selectedReservationAreaChoice?.area.price || 0) <= 0;

  const reservationPriceLabel = reservationIsFree
    ? "Gratis"
    : `Bs ${Number(selectedReservationAreaChoice?.area.price || 0)}`;

  const reservationAppliedPeopleCount = Math.max(
    1,
    Number(selectedReservationAreaChoice?.area.max_capacity || 1),
  );

  const reservationEffectiveSlot =
    reservationDraft.slot ||
    selectedReservationAreaAvailability?.slots[0] ||
    (selectedReservationAreaAvailability?.bookingMode === "day"
      ? "Todo el día"
      : "");

  const reservationResolvedSlotLabel = reservationEffectiveSlot || "Sin turno";

  const shouldShowReservationSlotSection =
    selectedReservationAreaAvailability?.bookingMode === "hour" &&
    (selectedReservationAreaChoice?.slots.length || 0) > 1;

  const reservationStatusNotice = !reservationDraft.unitOptionId
    ? ""
    : !selectedReservationOwnerId
      ? "La unidad seleccionada no tiene un titular asociado."
      : reservationAvailabilityLoading
        ? "Actualizando disponibilidad..."
        : reservationLiveCanBook === false ||
            selectedReservationAreaAvailability?.isAvailable === false
          ? reservationAvailabilityMessage ||
            selectedReservationAreaAvailability?.note ||
            "No hay disponibilidad para la fecha seleccionada."
          : "";

  const canContinueReservation =
    Boolean(selectedReservationAreaAvailability?.isAvailable) &&
    Boolean(reservationDraft.unitOptionId) &&
    Boolean(selectedReservationOwnerId) &&
    reservationLiveCanBook !== false &&
    Boolean(reservationEffectiveSlot) &&
    !reservationAvailabilityLoading;

  const canContinueMaintenance = Boolean(maintenanceDraft.areaId);

  useEffect(() => {
    if (!calendarActionModal || !contextInstance) {
      setModalAreaLiveAvailabilityMap({});
      setModalAreaAvailabilityLoading(false);
      return;
    }

    const requestId = modalAreaAvailabilityRequestRef.current + 1;
    modalAreaAvailabilityRequestRef.current = requestId;
    let isCancelled = false;

    const loadModalAreaAvailability = async () => {
      setModalAreaAvailabilityLoading(true);

      try {
        const entries = await Promise.all(
          calendarAreas.map(async (area) => {
            try {
              const response = await contextInstance.request({
                method: "GET",
                url: "/reservations-calendar",
                params: {
                  area_id: String(area.id),
                  date_at: calendarActionModal.row.dayKey,
                },
              });

              const payload = response?.data?.data ?? response?.data;
              return [
                String(area.id),
                extractDayAvailabilityFromCalendarResponse(
                  payload,
                  calendarActionModal.row.day,
                ),
              ] as const;
            } catch (_error) {
              return [String(area.id), null] as const;
            }
          }),
        );

        if (isCancelled || modalAreaAvailabilityRequestRef.current !== requestId) {
          return;
        }

        setModalAreaLiveAvailabilityMap(Object.fromEntries(entries));
      } catch (_error) {
        if (isCancelled || modalAreaAvailabilityRequestRef.current !== requestId) {
          return;
        }

        setModalAreaLiveAvailabilityMap({});
      } finally {
        if (isCancelled || modalAreaAvailabilityRequestRef.current !== requestId) {
          return;
        }

        setModalAreaAvailabilityLoading(false);
      }
    };

    void loadModalAreaAvailability();

    return () => {
      isCancelled = true;
    };
  }, [calendarActionModal, calendarAreas, contextInstance]);

  useEffect(() => {
    const gridElement = gridRef.current;
    if (!gridElement) return;

    const updateDayEntrySlots = () => {
      const rect = gridElement.getBoundingClientRect();
      if (!rect.height || !calendarRowCount) {
        setDayEntrySlots(DEFAULT_DAY_ENTRY_SLOTS);
        return;
      }

      const cellHeight = rect.height / Math.max(calendarRowCount, 1);
      const availableHeight = Math.max(0, cellHeight - DAY_CELL_CONTENT_OFFSET);
      const nextSlots = Math.max(
        1,
        Math.min(6, Math.floor(availableHeight / DAY_ENTRY_ROW_HEIGHT)),
      );

      setDayEntrySlots((current) => (current === nextSlots ? current : nextSlots));
    };

    const frame = window.requestAnimationFrame(updateDayEntrySlots);
    const observer = new ResizeObserver(() => {
      window.requestAnimationFrame(updateDayEntrySlots);
    });

    observer.observe(gridElement);
    window.addEventListener("resize", updateDayEntrySlots);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", updateDayEntrySlots);
    };
  }, [calendarRowCount, filteredReservations.length, loading]);

  const resolveDayActionMenuPosition = useCallback(
    (
      anchorEl: HTMLElement,
      pointerPosition?: ContextMenuPosition,
    ): ContextMenuPosition => {
      if (pointerPosition) return pointerPosition;

      const rect = anchorEl.getBoundingClientRect();
      return {
        x: rect.left + 20,
        y: rect.top + 40,
      };
    },
    [],
  );

  const openDayActionMenu = useCallback(
    (
      day: Date,
      anchorEl: HTMLElement,
      pointerPosition?: ContextMenuPosition,
    ) => {
      const dayKey = formatDateKey(day);
      const dayEntries = entriesByDay.get(dayKey) || [];

      setDayActionMenu((current) => {
        if (current?.row.dayKey === dayKey) {
          return null;
        }

        return {
          row: {
            day,
            dayKey,
            reservationCount: dayEntries.length,
          },
          position: resolveDayActionMenuPosition(anchorEl, pointerPosition),
        };
      });
    },
    [entriesByDay, resolveDayActionMenuPosition],
  );

  const closeDayActionMenu = useCallback(() => {
    setDayActionMenu(null);
  }, []);

  useEffect(() => {
    if (!calendarActionModal || calendarActionModal.action !== "create_reservation") {
      return;
    }

    if (!contextInstance || !reservationDraft.areaId || !selectedReservationUnit?.id) {
      setReservationAvailabilityLoading(false);
      setReservationAvailabilityMessage("");
      setReservationLiveCanBook(null);
      setReservationLiveAvailability(null);
      return;
    }

    if (!selectedReservationOwnerId) {
      setReservationAvailabilityLoading(false);
      setReservationLiveAvailability(null);
      setReservationLiveCanBook(false);
      setReservationAvailabilityMessage(
        "La unidad elegida no tiene un titular configurado para crear la reserva.",
      );
      return;
    }

    const requestId = reservationAvailabilityRequestRef.current + 1;
    reservationAvailabilityRequestRef.current = requestId;
    let isCancelled = false;

    const loadReservationAvailability = async () => {
      setReservationAvailabilityLoading(true);
      setReservationAvailabilityMessage("");
      setReservationLiveAvailability(null);
      setReservationLiveCanBook(null);

      try {
        const response = await contextInstance.request({
          method: "GET",
          url: "/reservations-calendar",
          params: {
            area_id: reservationDraft.areaId,
            date_at: calendarActionModal.row.dayKey,
            owner_id: selectedReservationOwnerId,
          },
        });

        if (isCancelled || reservationAvailabilityRequestRef.current !== requestId) {
          return;
        }

        const payload = response?.data?.data ?? response?.data;
        const availability = extractDayAvailabilityFromCalendarResponse(
          payload,
          calendarActionModal.row.day,
        );
        const rawRoot = unwrapReservationCalendarPayload(payload);

        setReservationLiveAvailability(availability);
        setReservationLiveCanBook(
          typeof rawRoot.reservations === "boolean"
            ? rawRoot.reservations
            : null,
        );
        setReservationAvailabilityMessage(
          typeof rawRoot.message === "string" ? rawRoot.message : "",
        );
      } catch (error: any) {
        if (isCancelled || reservationAvailabilityRequestRef.current !== requestId) {
          return;
        }

        setReservationLiveAvailability(null);
        setReservationLiveCanBook(null);
        setReservationAvailabilityMessage(
          error?.response?.data?.message ||
            error?.message ||
            "No pudimos cargar la disponibilidad en tiempo real.",
        );
      } finally {
        if (!isCancelled && reservationAvailabilityRequestRef.current === requestId) {
          setReservationAvailabilityLoading(false);
        }
      }
    };

    void loadReservationAvailability();

    return () => {
      isCancelled = true;
    };
  }, [
    calendarActionModal,
    contextInstance,
    reservationDraft.areaId,
    selectedReservationUnit?.id,
    selectedReservationOwnerId,
    unwrapReservationCalendarPayload,
  ]);

  useEffect(() => {
    if (!calendarActionModal || calendarActionModal.action !== "create_reservation") {
      return;
    }

    setReservationDraft((current) => {
      if (!selectedReservationAreaAvailability) return current;

      if (selectedReservationAreaAvailability.bookingMode === "day") {
        const nextDaySlot =
          selectedReservationAreaAvailability.slots[0] || "Todo el día";

        return current.slot === nextDaySlot
          ? current
          : {
              ...current,
              slot: nextDaySlot,
            };
      }

      const liveSlots = selectedReservationAreaAvailability.slots;

      if (liveSlots.length === 0) {
        return current.slot
          ? {
              ...current,
              slot: "",
            }
          : current;
      }

      if (current.slot && liveSlots.includes(current.slot)) {
        return current;
      }

      return {
        ...current,
        slot: liveSlots[0],
      };
    });
  }, [calendarActionModal, selectedReservationAreaAvailability]);

  useEffect(() => {
    if (
      calendarActionModal?.action === "create_reservation" &&
      reservationDraft.areaId &&
      selectedReservationAreaChoice &&
      !selectedReservationAreaChoice.isSelectable
    ) {
      setReservationDraft((current) =>
        current.areaId === reservationDraft.areaId
          ? {
              ...current,
              areaId: "",
              slot: "",
            }
          : current,
      );
    }
  }, [
    calendarActionModal?.action,
    reservationDraft.areaId,
    selectedReservationAreaChoice,
  ]);

  useEffect(() => {
    if (
      calendarActionModal?.action === "maintenance" &&
      maintenanceDraft.areaId &&
      selectedMaintenanceAreaChoice &&
      !selectedMaintenanceAreaChoice.isSelectable
    ) {
      setMaintenanceDraft((current) =>
        current.areaId === maintenanceDraft.areaId
          ? {
              ...current,
              areaId: "",
            }
          : current,
      );
    }
  }, [
    calendarActionModal?.action,
    maintenanceDraft.areaId,
    selectedMaintenanceAreaChoice,
  ]);

  const handleReservationAreaSelect = useCallback(
    (areaId: string) => {
      const nextChoice =
        modalAreaChoices.find((choice) => choice.areaId === areaId) || null;
      const nextSlot = !nextChoice
        ? ""
        : nextChoice.slots[0] ||
          (nextChoice.bookingMode === "day" ? "Todo el día" : "");

      setReservationDraft((current) => ({
        ...current,
        areaId,
        slot: nextSlot,
      }));
    },
    [modalAreaChoices],
  );

  const handleReservationDraftChange = useCallback(
    (event: { target: { name: string; value: string } }) => {
      const { name, value } = event.target;

      setReservationDraft((current) => {
        if (name === "unitOptionId") {
          const currentAreaChoice =
            modalAreaChoices.find((choice) => choice.areaId === current.areaId) ||
            null;
          const defaultSlot = !currentAreaChoice
            ? ""
            : currentAreaChoice.slots[0] ||
              (currentAreaChoice.bookingMode === "day" ? "Todo el día" : "");

          return {
            ...current,
            unitOptionId: value,
            slot: current.slot || defaultSlot,
          };
        }

        return {
          ...current,
          [name]: value,
        };
      });
    },
    [modalAreaChoices],
  );

  const handleReservationDateChange = useCallback(
    (event: { target: { value: string } }) => {
      const nextDayKey = String(event.target.value || "").trim();
      if (!nextDayKey || nextDayKey < minimumActionDate) return;

      const nextDay = new Date(`${nextDayKey}T00:00:00`);
      if (Number.isNaN(nextDay.getTime())) return;

      setCalendarActionModal((current) =>
        current
          ? {
              ...current,
              row: {
                ...current.row,
                day: nextDay,
                dayKey: nextDayKey,
              },
            }
          : current,
      );
      setSelectedDate(nextDay);
      setReservationDraft((current) => ({
        ...current,
        slot: "",
      }));
    },
    [minimumActionDate],
  );

  const handleReservationPreviewSave = useCallback(async () => {
    if (!contextInstance || !calendarActionModal || !selectedReservationAreaChoice) {
      return;
    }

    if (!selectedReservationOwnerId || !selectedReservationUnitChoice || !selectedReservationUnit) {
      showToast("La unidad seleccionada no es válida para crear la reserva.", "error");
      return;
    }

    if (!canContinueReservation) {
      showToast("Completa la selección del área, unidad y turno.", "warning");
      return;
    }

    const selectedResidentName = selectedReservationUnitChoice.resident
      ? `${getResidentName(selectedReservationUnitChoice.resident)} · ${selectedReservationUnitChoice.roleLabel}`
      : selectedReservationUnitChoice.roleLabel || "Responsable";
    const baseNote =
      reservationDraft.note.trim() ||
      `Reserva de ${selectedReservationAreaChoice.areaName}`;
    const obs = selectedResidentName
      ? `${baseNote} · Responsable: ${selectedResidentName}`
      : baseNote;
    const payload: Record<string, any> = {
      area_id: reservationDraft.areaId,
      owner_id: selectedReservationOwnerId,
      date_at: calendarActionModal.row.dayKey,
      people_count: reservationAppliedPeopleCount,
      amount: Number(selectedReservationAreaChoice.area.price || 0),
      obs,
      dpto_id: selectedReservationUnit.id,
    };

    if (reservationEffectiveSlot) {
      const normalizedPeriod =
        reservationEffectiveSlot === "Todo el día"
          ? "00:00-23:59"
          : reservationEffectiveSlot.replace(/\s*-\s*/, "-");
      payload.start_time = normalizedPeriod.split("-")[0];
      payload.periods = [normalizedPeriod];
    }

    setReservationSubmitting(true);

    try {
      const response = await contextInstance.request({
        method: "POST",
        url: "/reservations",
        data: payload,
      });

      if (response?.data?.success) {
        showToast(
          response?.data?.message || "Reserva creada exitosamente",
          "success",
        );
        setCalendarActionModal(null);
        await loadReservations({ silent: true });
        return;
      }

      showToast(
        response?.data?.message || "No se pudo crear la reserva",
        "error",
      );
    } catch (error: any) {
      showToast(
        error?.response?.data?.message ||
          error?.message ||
          "Ocurrió un error inesperado al crear la reserva.",
        "error",
      );
    } finally {
      setReservationSubmitting(false);
    }
  }, [
    calendarActionModal,
    canContinueReservation,
    contextInstance,
    loadReservations,
    reservationDraft.areaId,
    reservationDraft.note,
    reservationDraft.slot,
    reservationAppliedPeopleCount,
    reservationEffectiveSlot,
    selectedReservationAreaChoice,
    selectedReservationOwnerId,
    selectedReservationUnitChoice,
    selectedReservationUnit,
    showToast,
  ]);

  const handleMaintenanceDraftChange = useCallback(
    (event: { target: { name: string; value: string } }) => {
      const { name, value } = event.target;
      setMaintenanceDraft((current) => ({
        ...current,
        [name]: value,
      }));
    },
    [],
  );

  const handleMaintenancePreviewSave = useCallback(() => {
    showToast(
      "La creación de mantenimientos desde este calendario aún no está habilitada.",
      "info",
    );
    setCalendarActionModal(null);
  }, [showToast]);

  const dayActionMenuItems = useMemo<ContextMenuItem<CalendarDayActionRow>[]>(
    () => [
      {
        label: "Nueva reserva",
        icon: CalendarPlus,
        disabled: !canCreate,
        onClick: ({ row, closeMenu }) => {
          closeMenu();
          setCalendarActionModal({
            action: "create_reservation",
            row,
          });
        },
      },
      {
        label: "Poner en mantenimiento",
        icon: Wrench,
        onClick: ({ row, closeMenu }) => {
          closeMenu();
          setCalendarActionModal({
            action: "maintenance",
            row,
          });
        },
      },
    ],
    [canCreate],
  );

  const handlePeriodSelect = useCallback(
    (event: { target: { value: string } }) => {
      const [yearValue, monthValue] = String(event.target.value || "").split("-");
      const nextYear = Number(yearValue);
      const nextMonth = Number(monthValue) - 1;

      if (
        Number.isNaN(nextYear) ||
        Number.isNaN(nextMonth) ||
        nextMonth < 0 ||
        nextMonth > 11
      ) {
        return;
      }

      startTransition(() => {
        setCurrentMonth(new Date(nextYear, nextMonth, 1));
      });
    },
    [],
  );

  const handleDaySelect = useCallback(
    (day: Date) => {
      setSelectedDate(day);
    },
    [],
  );

  const canOpenDayActionMenu = useCallback(
    (day: Date) => day.getTime() > endOfDay(new Date()).getTime(),
    [],
  );

  const handlePreviousMonth = useCallback(() => {
    startTransition(() => {
      setCurrentMonth((current) => startOfMonth(subMonths(current, 1)));
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    startTransition(() => {
      setCurrentMonth((current) => startOfMonth(addMonths(current, 1)));
    });
  }, []);

  useEffect(() => {
    setDayActionMenu(null);
  }, [currentMonth, normalizedQuery, selectedAreaId, selectedStatuses]);

  const handleStatusesChange = useCallback(
    (event: { target: { value: string[] } }) => {
      const rawValues = Array.isArray(event.target.value)
        ? event.target.value.map(String)
        : [];

      if (rawValues.length === 0) {
        setSelectedStatuses(DEFAULT_VISIBLE_STATUS_IDS);
        return;
      }

      if (rawValues.includes("ALL")) {
        if (selectedStatuses.includes("ALL")) {
          setSelectedStatuses(rawValues.filter((value) => value !== "ALL"));
          return;
        }

        setSelectedStatuses(["ALL"]);
        return;
      }

      setSelectedStatuses(rawValues);
    },
    [selectedStatuses],
  );

  const handleRefresh = useCallback(() => {
    void loadReservations({ silent: true });
  }, [loadReservations]);

  const getAreaAvatarSrc = useCallback((area?: ReservationArea | null) => {
    const raw = area?.images?.[0];
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    return getUrlImages(raw.startsWith("/") ? raw : `/${raw}`);
  }, []);

  const renderReservationCard = useCallback(
    (entry: (typeof selectedDayEntries)[number], key: string) => {
      const reason = entry.reservation.reason?.trim() || "";
      const showReason =
        reason.length > 0 && STATUS_WITH_REASON.has(entry.status);
      const timeLimitMessage =
        selectedDayTimeLimits[String(entry.reservation.id)] ||
        formatReservationPaymentTimeLimitMessage(entry.reservation.time_limit);
      const showTimeLimit =
        timeLimitMessage.length > 0 &&
        shouldShowReservationPaymentTimeLimit(entry.status);

      return (
        <button
          key={key}
          type="button"
          className={styles.dayListItem}
          onClick={() => setDetailItem(entry.reservation)}
        >
          <div className={styles.dayListTop}>
            <div className={styles.dayListIdentity}>
              <Avatar
                name={entry.areaName}
                src={getAreaAvatarSrc(entry.reservation.area)}
                w={38}
                h={38}
                square={false}
              />
              <div className={styles.dayListText}>
                <p className={styles.dayListTitle}>{entry.areaName}</p>
                <p className={styles.dayListMeta}>
                  {entry.timeLabel} · {entry.residentName} · {entry.unitLabel}
                </p>
              </div>
            </div>
            <StatusBadge
              color={entry.color}
              backgroundColor={entry.backgroundColor}
              containerStyle={{
                width: "auto",
                height: "auto",
                justifyContent: "flex-end",
                alignItems: "flex-start",
              }}
              style={{
                fontSize: 11,
              }}
            >
              {entry.statusLabel}
            </StatusBadge>
          </div>

          {showReason ? (
            <p className={styles.dayListReason}>Motivo: {reason}</p>
          ) : null}
          {showTimeLimit ? (
            <p className={styles.dayListDeadline}>{timeLimitMessage}</p>
          ) : null}
        </button>
      );
    },
    [getAreaAvatarSrc, selectedDayTimeLimits],
  );

  const renderFlowHeaderCenter = useCallback(
    (activeStep: number) => (
      <div className={styles.flowHeaderCenter}>
        <p className={styles.flowEyebrow}>
          {`PASO ${activeStep + 1} DE ${CALENDAR_FLOW_TOTAL_STEPS}`}
        </p>
        <div className={styles.flowStepper} aria-hidden="true">
          {Array.from({ length: CALENDAR_FLOW_TOTAL_STEPS }, (_, index) => (
            <span
              key={`flow-step-${index}`}
              className={[
                styles.flowStepBar,
                index <= activeStep ? styles.flowStepBarActive : "",
              ]
                .filter(Boolean)
                .join(" ")}
            />
          ))}
        </div>
      </div>
    ),
    [],
  );

  if (!canView) return <NotAccess />;

  return (
    <>
      <section className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>Calendario</h1>
        </header>

        <div className={styles.toolbar}>
          <div className={styles.searchField}>
            <DataSearch
              name="calendarSearch"
              value={searchText}
              setSearch={setSearchText}
              searchMsg="Busca por área, residente, unidad o estado"
            />
          </div>

          <div className={styles.toolbarControls}>
            <div className={styles.filtersRow}>
              <div className={styles.inlineFilters}>
                <div className={styles.toolbarFieldMedium}>
                  <Select
                    name="calendarPeriod"
                    label="Periodo"
                    value={format(currentMonth, "yyyy-MM")}
                    options={periodOptions}
                    onChange={handlePeriodSelect}
                    inputStyle={FILTER_INPUT_STYLE}
                    style={FILTER_STYLE}
                  />
                </div>

                <div className={styles.toolbarFieldMedium}>
                  <Select
                    name="calendarArea"
                    label="Área"
                    value={selectedAreaId}
                    options={areaOptions}
                    onChange={(event: { target: { value: string } }) =>
                      setSelectedAreaId(event.target.value)
                    }
                    inputStyle={FILTER_INPUT_STYLE}
                    style={FILTER_STYLE}
                  />
                </div>

                <div className={styles.toolbarFieldLarge}>
                  <Select
                    name="calendarStatuses"
                    label="Estados"
                    value={selectedStatuses}
                    options={RESERVATION_STATUS_OPTIONS}
                    onChange={handleStatusesChange}
                    inputStyle={FILTER_INPUT_STYLE}
                    style={FILTER_STYLE}
                    multiSelect
                  />
                </div>
              </div>

              <button
                type="button"
                className={[
                  styles.compactFilterButton,
                  hasCompactFiltersApplied ? styles.compactFilterButtonActive : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => setFiltersOpen(true)}
                aria-label="Abrir filtros del calendario"
              >
                <IconFilter size={20} />
              </button>
            </div>

            <div className={styles.actionsRow}>
              <Button
                variant="secondary"
                onClick={handleRefresh}
                className={styles.toolbarActionButton}
                disabled={loading || refreshing}
                style={{ height: 48, width: "auto" }}
              >
                {refreshing ? "Actualizando..." : "Actualizar"}
              </Button>
              {canCreate ? (
                <Button
                  variant="primary"
                  onClick={() => router.push("/create-reservas")}
                  className={styles.toolbarActionButton}
                  style={{ height: 48, width: "auto", fontWeight: 700 }}
                >
                  Nueva reserva
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <DataModal
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          title="Filtros"
          buttonText=""
          buttonCancel="Cerrar"
          variant="mini"
        >
          <div className={styles.compactFilterModalBody}>
            <Select
              name="calendarPeriodCompact"
              label="Periodo"
              value={format(currentMonth, "yyyy-MM")}
              options={periodOptions}
              onChange={handlePeriodSelect}
              inputStyle={FILTER_INPUT_STYLE}
              style={FILTER_STYLE}
            />
            <Select
              name="calendarAreaCompact"
              label="Área"
              value={selectedAreaId}
              options={areaOptions}
              onChange={(event: { target: { value: string } }) =>
                setSelectedAreaId(event.target.value)
              }
              inputStyle={FILTER_INPUT_STYLE}
              style={FILTER_STYLE}
            />
            <Select
              name="calendarStatusesCompact"
              label="Estados"
              value={selectedStatuses}
              options={RESERVATION_STATUS_OPTIONS}
              onChange={handleStatusesChange}
              inputStyle={FILTER_INPUT_STYLE}
              style={FILTER_STYLE}
              multiSelect
            />
          </div>
        </DataModal>

        <div className={styles.contentGrid}>
          <div className={styles.calendarShell}>
            {loading ? (
              <div className={styles.loadingState}>Cargando calendario...</div>
            ) : null}

            <div className={styles.calendarMonthBar}>
              <button
                type="button"
                className={styles.monthNavButton}
                onClick={handlePreviousMonth}
                aria-label="Mes anterior"
              >
                <IconArrowLeft size={18} />
              </button>
              <div className={styles.calendarMonthTitle}>
                {capitalize(format(currentMonth, "MMMM yyyy", { locale: es }))}
              </div>
              <button
                type="button"
                className={styles.monthNavButton}
                onClick={handleNextMonth}
                aria-label="Mes siguiente"
              >
                <IconArrowRight size={18} />
              </button>
            </div>

            <div className={styles.weekdays}>
              {CALENDAR_WEEK_DAYS.map((day) => (
                <div key={day} className={styles.weekday}>
                  {day}
                </div>
              ))}
            </div>

            <div
              ref={gridRef}
              className={styles.grid}
              style={{
                gridTemplateRows: `repeat(${calendarRowCount}, minmax(0, 1fr))`,
              }}
            >
              {monthDays.map((day) => {
                const dayKey = formatDateKey(day);
                const dayEntries = entriesByDay.get(dayKey) || [];
                const shouldShowMoreIndicator = dayEntries.length > dayEntrySlots;
                const maxVisibleEntries = shouldShowMoreIndicator
                  ? Math.max(dayEntrySlots - 1, 0)
                  : dayEntrySlots;
                const visibleEntries = dayEntries.slice(0, maxVisibleEntries);
                const hiddenCount = Math.max(
                  0,
                  dayEntries.length - visibleEntries.length,
                );
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected =
                  selectedDate ? dayKey === formatDateKey(selectedDate) : false;

                return (
                  <div
                    key={dayKey}
                    role="button"
                    tabIndex={0}
                    className={[
                      styles.dayCell,
                      isCurrentMonth ? "" : styles.dayCellMuted,
                      isToday(day) ? styles.dayToday : "",
                      isSelected ? styles.daySelected : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={(event) => {
                      handleDaySelect(day);
                      if (canOpenDayActionMenu(day)) {
                        openDayActionMenu(day, event.currentTarget, {
                          x: event.clientX,
                          y: event.clientY,
                        });
                      } else {
                        closeDayActionMenu();
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleDaySelect(day);
                        if (canOpenDayActionMenu(day)) {
                          openDayActionMenu(day, event.currentTarget);
                        } else {
                          closeDayActionMenu();
                        }
                      }
                    }}
                  >
                    <div className={styles.dayHeader}>
                      <span className={styles.dayNumber}>{format(day, "d")}</span>
                      {dayEntries.length > 0 ? (
                        <span className={styles.dayCount}>{dayEntries.length}</span>
                      ) : null}
                    </div>

                    <div className={styles.dayEntries}>
                      {visibleEntries.map((entry) => (
                        <button
                          key={`${dayKey}-${entry.reservation.id}`}
                          type="button"
                          className={styles.entryChip}
                          style={{
                            ["--entry-dot-color" as string]: entry.color,
                          }}
                          onClick={(event) => {
                            event.stopPropagation();
                            setDetailItem(entry.reservation);
                          }}
                          title={`${entry.chipLabel} · ${entry.residentName} · ${entry.unitLabel}`}
                        >
                          <span className={styles.entryDot} />
                          {entry.chipLabel}
                        </button>
                      ))}

                      {hiddenCount > 0 ? (
                        <span className={styles.moreEntries}>+{hiddenCount} más</span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className={styles.dayPanel}>
            <div className={styles.dayPanelHeader}>
              <div>
                <h3 className={styles.dayPanelTitle}>{selectedDayLabel}</h3>
              </div>
              {selectedDate ? (
                <span className={styles.dayPanelSummary}>
                  {selectedDayEntries.length} reservas
                </span>
              ) : null}
            </div>

            {selectedDayEntries.length > 0 ? (
              <div className={styles.dayList}>
                {selectedDayEntries.map((entry) =>
                  renderReservationCard(
                    entry,
                    `detail-${entry.dayKey}-${entry.reservation.id}`,
                  ),
                )}
              </div>
            ) : (
              <div className={styles.emptyDay}>
                No hay reservas para este día con los filtros actuales.
              </div>
            )}
          </aside>
        </div>

        {detailItem ? (
          <ReservationDetailModal
            open
            item={detailItem}
            onClose={() => setDetailItem(null)}
            reLoad={handleRefresh}
          />
        ) : null}

        {calendarActionModal ? (
          <DataModal
            open
            onClose={() => setCalendarActionModal(null)}
            title={
              calendarActionModal.action === "create_reservation"
                ? reservationStep === 0
                  ? "Nueva reserva"
                  : "Confirmación"
                : maintenanceStep === 0
                  ? "Mantenimiento"
                  : "Confirmación"
            }
            titleClassName={styles.flowHeaderTitle}
            headerCenter={
              calendarActionModal.action === "create_reservation"
                ? renderFlowHeaderCenter(reservationStep)
                : renderFlowHeaderCenter(maintenanceStep)
            }
            buttonText=""
            buttonCancel=""
            variant="mini"
            maxWidth={760}
            className="contScrollable"
          >
            {calendarActionModal.action === "create_reservation" ? (
              <div className={styles.flowModalBody}>
                {reservationStep === 0 ? (
                  <div className={styles.flowContent}>
                    <div className={styles.flowSection}>
                      <div className={styles.sectionHeading}>
                        <h4 className={styles.sectionTitle}>Áreas sociales</h4>
                        <p className={styles.sectionDescription}>
                          Selecciona el área que se reservará.
                        </p>
                      </div>

                      <div className={styles.areaChoiceGrid}>
                        {modalAreaChoices.map((choice) => {
                          const isSelected =
                            reservationDraft.areaId === choice.areaId;

                          return (
                            <button
                              key={`reservation-area-${choice.areaId}`}
                              type="button"
                              className={[
                                styles.areaChoiceCard,
                                isSelected ? styles.areaChoiceCardSelected : "",
                                modalAreaAvailabilityLoading
                                  ? styles.areaChoiceCardLoading
                                  : "",
                                !choice.isSelectable
                                  ? styles.areaChoiceCardDisabled
                                  : "",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                              onClick={() => handleReservationAreaSelect(choice.areaId)}
                              disabled={
                                modalAreaAvailabilityLoading || !choice.isSelectable
                              }
                            >
                              <div className={styles.areaChoiceTop}>
                                <Avatar
                                  name={choice.areaName}
                                  src={getAreaAvatarSrc(choice.area)}
                                  w={42}
                                  h={42}
                                  square={false}
                                />
                                <div className={styles.areaChoiceText}>
                                  <p className={styles.areaChoiceTitle}>
                                    {choice.areaName}
                                  </p>
                                  {modalAreaAvailabilityLoading ? (
                                    <div
                                      className={styles.areaChoiceSkeletonMeta}
                                      aria-hidden="true"
                                    />
                                  ) : (
                                    <p className={styles.areaChoiceMeta}>
                                      {getReservationAreaMeta(choice)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className={styles.flowSection}>
                      <div className={styles.sectionHeading}>
                        <h4 className={styles.sectionTitle}>Datos de la reserva</h4>
                      </div>

                      <div className={styles.modalFieldGrid}>
                        <Input
                          type="date"
                          name="reservationDate"
                          label="Fecha"
                          value={calendarActionModalDayKey}
                          min={minimumActionDate}
                          onChange={handleReservationDateChange}
                          className={styles.modalDateField}
                        />
                        <Select
                          name="unitOptionId"
                          label="Unidad"
                          value={reservationDraft.unitOptionId}
                          options={unitOptions}
                          onChange={handleReservationDraftChange}
                          filter
                          placeholder="Selecciona una unidad"
                        />
                      </div>

                      {reservationStatusNotice && !shouldShowReservationSlotSection ? (
                        <div className={styles.inlineNotice}>
                          {reservationStatusNotice}
                        </div>
                      ) : null}
                    </div>

                    {selectedReservationAreaChoice && shouldShowReservationSlotSection ? (
                      <div className={styles.flowSection}>
                        <div className={styles.sectionHeading}>
                          <h4 className={styles.sectionTitle}>Turnos disponibles</h4>
                        </div>

                          <div className={styles.slotGroupStack}>
                            {reservationStatusNotice && reservationDraft.unitOptionId ? (
                              <div className={styles.inlineNotice}>
                                {reservationStatusNotice}
                              </div>
                            ) : null}

                            {selectedReservationAreaAvailability?.slots.length ? (
                              <div className={styles.slotGroup}>
                                <div className={styles.slotGrid}>
                                  {selectedReservationAreaAvailability.slots.map((slot) => (
                                    <button
                                      key={`slot-${slot}`}
                                      type="button"
                                      className={[
                                        styles.slotChip,
                                        reservationDraft.slot === slot
                                          ? styles.slotChipSelected
                                          : "",
                                      ]
                                        .filter(Boolean)
                                        .join(" ")}
                                      onClick={() =>
                                        setReservationDraft((current) => ({
                                          ...current,
                                          slot,
                                        }))
                                      }
                                    >
                                      {slot}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : reservationDraft.unitOptionId &&
                              !reservationAvailabilityLoading ? (
                              <div className={styles.inlineNotice}>
                                {reservationAvailabilityMessage ||
                                  selectedReservationAreaAvailability?.note ||
                                  "No hay turnos disponibles para la fecha seleccionada."}
                              </div>
                            ) : null}

                            {reservationBlockedSlots.length > 0 ? (
                              <div className={styles.slotGroup}>
                                <span className={styles.slotGroupLabelMuted}>
                                  Ocupados o no disponibles
                                </span>
                                <div className={styles.slotGrid}>
                                  {reservationBlockedSlots.map((slot) => (
                                    <span
                                      key={`blocked-slot-${slot}`}
                                      className={[
                                        styles.slotChip,
                                        styles.slotChipMuted,
                                      ]
                                        .filter(Boolean)
                                        .join(" ")}
                                    >
                                      {slot}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : null}

                            {reservationMaintenanceSlots.length > 0 ? (
                              <div className={styles.slotGroup}>
                                <span className={styles.slotGroupLabelDanger}>
                                  Mantenimiento
                                </span>
                                <div className={styles.slotGrid}>
                                  {reservationMaintenanceSlots.map((slot) => (
                                    <span
                                      key={`maintenance-slot-${slot}`}
                                      className={[
                                        styles.slotChip,
                                        styles.slotChipDanger,
                                      ]
                                        .filter(Boolean)
                                        .join(" ")}
                                    >
                                      {slot}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className={styles.flowContent}>
                    <div className={styles.reviewTable}>
                      {[
                        ["Fecha", calendarActionModalDayLabel],
                        ["Área social", selectedReservationAreaChoice?.areaName || "Sin área"],
                        [
                          "Unidad",
                          selectedReservationUnit
                            ? getUnitLabel(selectedReservationUnit)
                            : "Sin unidad",
                        ],
                        ["Responsable", selectedReservationResidentLabel],
                        ["Horario", reservationResolvedSlotLabel],
                        ["Capacidad", `${reservationAppliedPeopleCount} personas`],
                        ["Reserva", reservationPriceLabel],
                      ].map(([label, value]) => (
                        <div key={String(label)} className={styles.reviewRow}>
                          <div className={styles.reviewKey}>{label}</div>
                          <div className={styles.reviewValue}>{value}</div>
                        </div>
                      ))}
                    </div>

                    <TextArea
                      name="note"
                      label="Observación"
                      value={reservationDraft.note}
                      onChange={handleReservationDraftChange}
                      placeholder="Ej. cumpleaños familiar, reunión privada, limpieza posterior"
                      lines={4}
                    />
                  </div>
                )}

                  <div className={styles.flowFooter}>
                    <p className={styles.flowFooterHint}>
                      {reservationStep === 0
                        ? "Selecciona el área y la unidad para continuar."
                        : "Confirma la información para registrar la reserva."}
                    </p>
                    <div className={styles.flowFooterActions}>
                    {reservationStep > 0 ? (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setReservationStep(0);
                        }}
                        style={{ height: 46, width: "auto" }}
                      >
                        Atrás
                      </Button>
                    ) : null}
                    <Button
                      variant="primary"
                      disabled={
                        reservationSubmitting ||
                        (reservationStep === 0 ? !canContinueReservation : false)
                      }
                      onClick={() => {
                        if (reservationStep === 0) {
                          setReservationStep(1);
                          return;
                        }

                        void handleReservationPreviewSave();
                      }}
                      style={{ height: 46, width: "auto" }}
                    >
                      {reservationStep === 0
                        ? "Continuar"
                        : reservationSubmitting
                          ? "Guardando..."
                          : "Reservar"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.flowModalBody}>
                {maintenanceStep === 0 ? (
                  <div className={styles.flowContent}>
                    <div className={styles.flowSection}>
                      <div className={styles.sectionHeading}>
                        <h4 className={styles.sectionTitle}>Área</h4>
                        <p className={styles.sectionDescription}>
                          Selecciona el área que quedará bloqueada por
                          mantenimiento.
                        </p>
                      </div>

                      <div className={styles.areaChoiceGrid}>
                        {modalAreaChoices.map((choice) => {
                          const isSelected =
                            maintenanceDraft.areaId === choice.areaId;

                          return (
                            <button
                              key={`maintenance-area-${choice.areaId}`}
                              type="button"
                              className={[
                                styles.areaChoiceCard,
                                isSelected ? styles.areaChoiceCardSelected : "",
                                modalAreaAvailabilityLoading
                                  ? styles.areaChoiceCardLoading
                                  : "",
                                !choice.isSelectable
                                  ? styles.areaChoiceCardDisabled
                                  : "",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                              onClick={() =>
                                setMaintenanceDraft((current) => ({
                                  ...current,
                                  areaId: choice.areaId,
                                }))
                              }
                              disabled={
                                modalAreaAvailabilityLoading || !choice.isSelectable
                              }
                            >
                              <div className={styles.areaChoiceTop}>
                                <Avatar
                                  name={choice.areaName}
                                  src={getAreaAvatarSrc(choice.area)}
                                  w={42}
                                  h={42}
                                  square={false}
                                />
                                <div className={styles.areaChoiceText}>
                                  <p className={styles.areaChoiceTitle}>
                                    {choice.areaName}
                                  </p>
                                  {modalAreaAvailabilityLoading ? (
                                    <div
                                      className={styles.areaChoiceSkeletonMeta}
                                      aria-hidden="true"
                                    />
                                  ) : (
                                    <p className={styles.areaChoiceMeta}>
                                      {getReservationAreaMeta(choice)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className={styles.flowSection}>
                      <div className={styles.sectionHeading}>
                        <h4 className={styles.sectionTitle}>Alcance</h4>
                        <p className={styles.sectionDescription}>
                          Define si el bloqueo aplica solo al día seleccionado o
                          a varios días.
                        </p>
                      </div>

                      <div className={styles.modeChoiceGrid}>
                        <button
                          type="button"
                          className={[
                            styles.modeChoiceCard,
                            maintenanceDraft.scope === "day"
                              ? styles.modeChoiceCardSelected
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          onClick={() =>
                            setMaintenanceDraft((current) => ({
                              ...current,
                              scope: "day",
                              endDate: calendarActionModal.row.dayKey,
                            }))
                          }
                        >
                          <strong>Solo este día</strong>
                          <span>Bloqueo breve y puntual.</span>
                        </button>
                        <button
                          type="button"
                          className={[
                            styles.modeChoiceCard,
                            maintenanceDraft.scope === "range"
                              ? styles.modeChoiceCardSelected
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          onClick={() =>
                            setMaintenanceDraft((current) => ({
                              ...current,
                              scope: "range",
                              endDate:
                                current.endDate || calendarActionModal.row.dayKey,
                            }))
                          }
                        >
                          <strong>Varios días</strong>
                          <span>Cuando el mantenimiento toma más tiempo.</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={styles.flowContent}>
                    <div
                      className={[
                        styles.reviewTable,
                        styles.reviewTableCompact,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {[
                        ["Área", selectedMaintenanceAreaChoice?.areaName || "Sin área"],
                        ["Inicio", calendarActionModalDayLabel],
                        [
                          "Alcance",
                          maintenanceDraft.scope === "day"
                            ? "Solo este día"
                            : `Hasta ${maintenanceDraft.endDate || calendarActionModal.row.dayKey}`,
                        ],
                      ].map(([label, value]) => (
                        <div key={String(label)} className={styles.reviewRow}>
                          <div className={styles.reviewKey}>{label}</div>
                          <div className={styles.reviewValue}>{value}</div>
                        </div>
                      ))}
                    </div>

                    {maintenanceDraft.scope === "range" ? (
                      <div className={styles.modalFieldGrid}>
                        <Input
                          type="date"
                          name="endDate"
                          label="Fecha final"
                          value={maintenanceDraft.endDate}
                          min={calendarActionModal.row.dayKey}
                          onChange={handleMaintenanceDraftChange}
                        />
                      </div>
                    ) : null}

                    <TextArea
                      name="reason"
                      label="Motivo"
                      value={maintenanceDraft.reason}
                      onChange={handleMaintenanceDraftChange}
                      placeholder="Ej. limpieza profunda, reparación, pintura, revisión técnica"
                      lines={5}
                    />

                    <div className={styles.inlineNotice}>
                      El registro de mantenimiento desde este calendario estará
                      disponible próximamente.
                    </div>
                  </div>
                )}

                <div className={styles.flowFooter}>
                  <p className={styles.flowFooterHint}>
                    {maintenanceStep === 0
                      ? "Selecciona el área y el alcance para continuar."
                      : "Revisa la información antes de guardar el bloqueo."}
                  </p>
                  <div className={styles.flowFooterActions}>
                    {maintenanceStep > 0 ? (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setMaintenanceStep(0);
                        }}
                        style={{ height: 46, width: "auto" }}
                      >
                        Atrás
                      </Button>
                    ) : null}
                    <Button
                      variant="primary"
                      onClick={() => {
                        if (maintenanceStep === 0) {
                          setMaintenanceStep(1);
                          return;
                        }

                        handleMaintenancePreviewSave();
                      }}
                      disabled={maintenanceStep === 0 ? !canContinueMaintenance : false}
                      style={{ height: 46, width: "auto" }}
                    >
                      {maintenanceStep === 0 ? "Continuar" : "Guardar mantenimiento"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DataModal>
        ) : null}
      </section>

      {dayActionMenu ? (
        <ContextMenu
          open
          items={dayActionMenuItems}
          position={dayActionMenu.position}
          row={dayActionMenu.row}
          rowIndex={0}
          onClose={closeDayActionMenu}
        />
      ) : null}
    </>
  );
};

export default CalendarPage;
