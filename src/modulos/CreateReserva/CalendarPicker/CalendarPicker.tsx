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
}

interface CalendarPickerProps {
  selectedDate?: string;
  onDateChange: (dateString: string | undefined) => void;
  busyDays?: string[];
  available_days?: string[];
}

const CalendarPicker: React.FC<CalendarPickerProps> = ({
  selectedDate,
  onDateChange,
  busyDays = [],
  available_days = [],
}) => {
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  console.log(busyDays);
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

  const goToPrev = () =>
    setCurrentDateForView((prev) =>
      viewMode === "month" ? subMonths(prev, 1) : subWeeks(prev, 1)
    );

  const goToNext = () =>
    setCurrentDateForView((prev) =>
      viewMode === "month" ? addMonths(prev, 1) : addWeeks(prev, 1)
    );

  const handleDateSelect = (day: CalendarDay) => {
    if (!day.isCurrentView || day.isPast) return;
    if (day.isPartiallyBusy) return;

    setSelectedDateInternal(day.date);
    onDateChange(format(day.date, "yyyy-MM-dd"));
  };

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.calendarViewControls}>
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
      </div>

      <div className={styles.calendarGridContainer}>
        <div className={styles.calendarNavigation}>
          <button
            type="button"
            onClick={goToPrev}
            className={styles.calendarNavButton}
            aria-label="Anterior"
          >
            <IconArrowLeft size={18} />
          </button>
          <span className={styles.calendarMonthYear}>
            {format(currentDateForView, "MMMM yyyy", { locale: es })}
          </span>
          <button
            type="button"
            onClick={goToNext}
            className={styles.calendarNavButton}
            aria-label="Siguiente"
          >
            <IconArrowRight size={18} />
          </button>
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
              day.isSelected && styles.selectedDay,
              day.isPartiallyBusy && !isDisabled && styles.partiallyBusyDay,
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
