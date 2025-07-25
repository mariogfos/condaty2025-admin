// src/components/CalendarPicker/CalendarPicker.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  format,
  parse,
  isValid,
  isSameDay,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  isBefore,
  startOfDay,
  isSameMonth,
} from "date-fns";
import { es } from "date-fns/locale";
import styles from "./CalendarPicker.module.css";
import {
  IconArrowLeft,
  IconArrowRight,
} from "@/components/layout/icons/IconsBiblioteca";

interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isCurrentView: boolean;
  isPartiallyBusy: boolean;
  isSelected: boolean;
  isPast: boolean;
  isToday: boolean;
  isSelectedBusy: boolean | null;
}

interface CalendarPickerProps {
  selectedDate?: string;
  onDateChange: (dateString: string | undefined) => void;
  onMonthSelect?: (dateString: string | undefined) => void;
  busyDays?: string[];
  available_days?: string[];
  loading?: boolean;
}

const CalendarPicker: React.FC<CalendarPickerProps> = ({
  selectedDate,
  onDateChange,
  busyDays = [],
  available_days = [],
  onMonthSelect,
  loading,
}) => {
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const getInitialDate = () => {
    const parsed = selectedDate
      ? parse(selectedDate, "yyyy-MM-dd", new Date())
      : null;
    return parsed && isValid(parsed) ? parsed : new Date();
  };

  const [currentDateForView, setCurrentDateForView] = useState(getInitialDate);
  const [selectedDateInternal, setSelectedDateInternal] = useState<Date | null>(
    () => {
      const parsed = selectedDate
        ? parse(selectedDate, "yyyy-MM-dd", new Date())
        : null;
      return parsed && isValid(parsed) ? parsed : null;
    }
  );

  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const weekDayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  const weekDayNameToIndex: Record<string, number> = {
    Domingo: 0,
    Lunes: 1,
    Martes: 2,
    Miércoles: 3,
    Jueves: 4,
    Viernes: 5,
    Sábado: 6,
  };
  const allowedWeekdayIndices = useMemo(
    () =>
      available_days
        .map((name) => weekDayNameToIndex[name])
        .filter((i): i is number => typeof i === "number"),
    [available_days]
  );

  useEffect(() => {
    const parsed = selectedDate
      ? parse(selectedDate, "yyyy-MM-dd", new Date())
      : null;
    const validDate = parsed && isValid(parsed) ? parsed : null;

    const hasChanged =
      validDate && selectedDateInternal
        ? !isSameDay(validDate, selectedDateInternal)
        : validDate !== selectedDateInternal;

    if (hasChanged) {
      setSelectedDateInternal(validDate);
      if (validDate) setCurrentDateForView(validDate);
    }
  }, [selectedDate]);

  const currentInterval = useMemo(() => {
    const weekOpts = { locale: es };
    const start =
      viewMode === "month"
        ? startOfWeek(startOfMonth(currentDateForView), weekOpts)
        : startOfWeek(currentDateForView, weekOpts);

    const end =
      viewMode === "month"
        ? endOfWeek(endOfMonth(currentDateForView), weekOpts)
        : endOfWeek(currentDateForView, weekOpts);

    return { start, end };
  }, [viewMode, currentDateForView]);

  const generateCalendarDays = useCallback(() => {
    const today = startOfDay(new Date());
    const busySet = new Set(busyDays);
    const refMonth = startOfMonth(currentDateForView);

    const days = eachDayOfInterval(currentInterval).map((date) => {
      const formatted = format(date, "yyyy-MM-dd");
      const isAllowed = allowedWeekdayIndices.includes(date.getDay());

      return {
        date,
        dayOfMonth: date.getDate(),
        isCurrentMonth: isSameMonth(date, refMonth),
        isCurrentView: viewMode === "week" || isSameMonth(date, refMonth),
        isPartiallyBusy: busySet.has(formatted),
        isSelected: selectedDateInternal
          ? isSameDay(date, selectedDateInternal)
          : false,
        isPast: isBefore(date, today) || !isAllowed,
        isToday: isSameDay(date, today),
        isSelectedBusy:
          selectedDateInternal &&
          isSameDay(date, selectedDateInternal) &&
          busySet.has(formatted),
      };
    });

    setCalendarDays(days);
  }, [
    allowedWeekdayIndices,
    currentInterval,
    busyDays,
    selectedDateInternal,
    viewMode,
    currentDateForView,
  ]);

  useEffect(() => {
    generateCalendarDays();
  }, [generateCalendarDays]);

  const goToPrev = () => {
    const newDate =
      viewMode === "month"
        ? subMonths(currentDateForView, 1)
        : subWeeks(currentDateForView, 1);

    if (viewMode === "month") {
      onMonthSelect?.(format(startOfMonth(newDate), "yyyy-MM-dd"));
    }

    setCurrentDateForView(newDate);
  };

  const goToNext = () => {
    const newDate =
      viewMode === "month"
        ? addMonths(currentDateForView, 1)
        : addWeeks(currentDateForView, 1);

    if (viewMode === "month") {
      onMonthSelect?.(format(startOfMonth(newDate), "yyyy-MM-dd"));
    }

    setCurrentDateForView(newDate);
  };

  const handleDateSelect = (day: CalendarDay) => {
    if (!day.isCurrentView || day.isPast) return;

    setSelectedDateInternal(day.date);
    onDateChange(format(day.date, "yyyy-MM-dd"));
  };

  return (
    <div className={styles.calendarContainer}>
      {/* <div className={styles.calendarViewControls}>
        {["month", "week"].map((mode) => (
          <button
            key={mode}
            type="button"
            className={`${styles.controlButton} ${
              viewMode === mode ? styles.active : ""
            }`}
            onClick={() => setViewMode(mode as "month" | "week")}
          >
            {mode === "month" ? "Mes" : "Semanas"}
          </button>
        ))}
      </div> */}

      <div
        className={styles.calendarGridContainer}
        style={{
          filter: loading ? "blur(4px)" : "none",
          pointerEvents: loading ? "none" : "visible",
        }}
      >
        <div>
          <div className={styles.calendarNavigation}>
            <button
              type="button"
              onClick={goToPrev}
              className={styles.calendarNavButton}
              aria-label="Anterior"
            >
              <IconArrowLeft size={18} />
            </button>

            <button
              type="button"
              onClick={goToNext}
              className={styles.calendarNavButton}
              aria-label="Siguiente"
            >
              <IconArrowRight size={18} />
            </button>
          </div>
          <p className={styles.calendarMonthYear}>
            {format(currentDateForView, "MMMM yyyy", { locale: es })}
          </p>
        </div>

        <div className={styles.calendarWeekdays}>
          {weekDayNames.map((name) => (
            <div key={name} className={styles.calendarWeekday}>
              {name}
            </div>
          ))}
        </div>

        <div className={styles.calendarDaysGrid}>
          {calendarDays.map((day, index) => {
            const isDisabled = !day.isCurrentView || day.isPast;

            const classes = [
              styles.calendarDayButton,
              !day.isCurrentView && styles.outsideDay,
              isDisabled && styles.disabledDay,
              day.isToday && styles.today,
              day.isPartiallyBusy && !isDisabled && styles.partiallyBusyDay,
              day.isSelected && styles.selectedDay,
              day.isSelectedBusy && !isDisabled && styles.selectedBusyDay,
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <div key={index} className={styles.calendarDayCell}>
                <button
                  type="button"
                  disabled={isDisabled}
                  className={classes}
                  onClick={() => handleDateSelect(day)}
                  aria-label={`Seleccionar ${format(day.date, "PPPP", {
                    locale: es,
                  })}${
                    day.isPartiallyBusy && !isDisabled ? " (con reservas)" : ""
                  }${isDisabled ? " (no disponible)" : ""}`}
                >
                  <span>{day.dayOfMonth}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarPicker;
