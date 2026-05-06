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
  endOfDay,
  format,
  isSameMonth,
  isToday,
  isWithinInterval,
  startOfMonth,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";
import {
  IconArrowLeft,
  IconArrowRight,
} from "@/components/layout/icons/IconsBiblioteca";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import ReservationDetailModal from "@/modulos/Reservas/RenderView/RenderView";
import { AxiosContext } from "@/mk/contexts/AxiosInstanceProvider";
import { useAuth } from "@/mk/contexts/AuthProvider";
import Button from "@/mk/components/forms/Button/Button";
import DataSearch from "@/mk/components/forms/DataSearch/DataSearch";
import Select from "@/mk/components/forms/Select/Select";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { capitalize, capitalizeWords } from "@/mk/utils/string";
import { RESERVATION_STATUS_OPTIONS } from "@/modulos/Reservas/constants/reservationConstants";
import { getUrlImages } from "@/mk/utils/string";
import type {
  ReservationArea,
  ReservationExtraData,
  ReservationListItem,
} from "@/modulos/Reservas/types";
import {
  CALENDAR_WEEK_DAYS,
  buildCalendarEntries,
  buildMonthGrid,
  dedupeReservationsById,
  formatDateKey,
  getVisibleMonthRange,
  matchesReservationFilters,
  normalizeSearchText,
  splitRangeByYear,
} from "./helpers";
import styles from "./CalendarPage.module.css";

const MAX_EVENTS_PER_DAY = 3;

const FILTER_INPUT_STYLE = {
  height: 44,
  backgroundColor: "var(--cModalSurfaceRaised)",
  border: "1px solid var(--cModalBorder)",
  borderRadius: 12,
  padding: "16px",
  fontSize: 15,
  fontWeight: 600,
  color: "var(--cWhiteV1)",
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
  const [reservations, setReservations] = useState<ReservationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detailItem, setDetailItem] = useState<ReservationListItem | null>(null);

  const deferredSearch = useDeferredValue(searchText);
  const requestKeyRef = useRef("");
  const hasLoadedAreasRef = useRef(false);

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
    } catch (_error) {
      setAreas([]);
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

  const entriesByDay = useMemo(
    () =>
      buildCalendarEntries(
        filteredReservations,
        visibleRange.start,
        visibleRange.end,
      ),
    [filteredReservations, visibleRange.end, visibleRange.start],
  );

  const selectedDayKey = selectedDate ? formatDateKey(selectedDate) : "";
  const selectedDayEntries = selectedDayKey
    ? entriesByDay.get(selectedDayKey) || []
    : [];

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

  const selectedDayLabel = useMemo(() => {
    if (!selectedDate) return "Selecciona un dia";
    return capitalize(
      format(selectedDate, "EEEE d 'de' MMMM yyyy", { locale: es }),
    );
  }, [selectedDate]);

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

  if (!canView) return <NotAccess />;

  return (
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
                options={[
                  { id: "ALL", name: "Todas las áreas" },
                  ...visibleAreaOptions.map((area) => ({
                    id: String(area.id),
                    name: capitalizeWords(area.title || `Área ${area.id}`),
                  })),
                ]}
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

          <div className={styles.actionsRow}>
            <Button
              variant="secondary"
              onClick={handleRefresh}
              disabled={loading || refreshing}
              style={{ height: 44, width: "auto" }}
            >
              {refreshing ? "Actualizando..." : "Actualizar"}
            </Button>
            {canCreate ? (
              <Button
                variant="primary"
                onClick={() => router.push("/create-reservas")}
                style={{ height: 44, width: "auto", fontWeight: 700 }}
              >
                Nueva reserva
              </Button>
            ) : null}
          </div>
        </div>
      </div>

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
            className={styles.grid}
            style={{
              gridTemplateRows: `repeat(${calendarRowCount}, minmax(0, 1fr))`,
            }}
          >
            {monthDays.map((day) => {
              const dayKey = formatDateKey(day);
              const dayEntries = entriesByDay.get(dayKey) || [];
              const visibleEntries = dayEntries.slice(0, MAX_EVENTS_PER_DAY);
              const hiddenCount = dayEntries.length - visibleEntries.length;
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
                  onClick={() => handleDaySelect(day)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleDaySelect(day);
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
              {selectedDayEntries.map((entry) => {
                const reason = entry.reservation.reason?.trim() || "";
                const showReason =
                  reason.length > 0 && STATUS_WITH_REASON.has(entry.status);

                return (
                  <button
                    key={`detail-${entry.dayKey}-${entry.reservation.id}`}
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
                      <span
                        className={styles.statusBadge}
                        style={{
                          color: entry.color,
                        }}
                      >
                        {entry.statusLabel}
                      </span>
                    </div>

                    {showReason ? (
                      <p className={styles.dayListReason}>Motivo: {reason}</p>
                    ) : null}
                  </button>
                );
              })}
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
    </section>
  );
};

export default CalendarPage;
