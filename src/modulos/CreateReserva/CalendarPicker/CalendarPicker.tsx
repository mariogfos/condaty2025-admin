// src/components/CalendarPicker/CalendarPicker.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  addWeeks, // Importar addWeeks
  subWeeks, // Importar subWeeks
  eachDayOfInterval,
  isBefore,
  startOfDay,
  isSameMonth,
  isWithinInterval, // Para saber si la fecha seleccionada está en la semana/mes visible
} from 'date-fns';
import { es } from 'date-fns/locale';
import styles from './CalendarPicker.module.css'; // Importa los estilos locales
// Asegúrate de importar tus iconos
import { IconArrowLeft, IconArrowRight } from '@/components/layout/icons/IconsBiblioteca';

// Interfaz día (sin cambios)
interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean; // Sigue siendo relevante para estilo 'outside' en vista mes
  isCurrentView: boolean; // Nuevo: para indicar si pertenece al mes/semana actual visible
  isUnavailable: boolean;
  isSelected: boolean;
  isPast: boolean;
  isToday: boolean;
}

// Props (sin 'styles')
interface CalendarPickerProps {
  selectedDate?: string; // 'yyyy-MM-dd'
  onDateChange: (dateString: string | undefined) => void;
  busyDays?: string[]; // 'yyyy-MM-dd'
}

const CalendarPicker: React.FC<CalendarPickerProps> = ({
  selectedDate,
  onDateChange,
  busyDays = [],
}) => {
  // --- Estados ---
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  // Fecha que determina el mes o la semana actual visible
  const [currentDateForView, setCurrentDateForView] = useState<Date>(() => {
      const initialDate = selectedDate && isValid(parse(selectedDate, 'yyyy-MM-dd', new Date()))
          ? parse(selectedDate, 'yyyy-MM-dd', new Date())
          : new Date();
      return initialDate;
  });

  // Estado interno para la fecha seleccionada (como objeto Date)
  const [selectedDateInternal, setSelectedDateInternal] = useState<Date | null>(() => {
    const parsed = selectedDate ? parse(selectedDate, 'yyyy-MM-dd', new Date()) : null;
    return parsed && isValid(parsed) ? parsed : null;
  });

  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);

  const daysOfWeek = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // --- Sincronizar prop externa con estado interno ---
  useEffect(() => {
    const newParsedDate = selectedDate ? parse(selectedDate, 'yyyy-MM-dd', new Date()) : null;
    const newValidSelectedDate = newParsedDate && isValid(newParsedDate) ? newParsedDate : null;

    let datesDiffer = true;
    if (newValidSelectedDate && selectedDateInternal) {
        datesDiffer = !isSameDay(newValidSelectedDate, selectedDateInternal);
    } else if (!newValidSelectedDate && !selectedDateInternal) {
        datesDiffer = false;
    }

    if (datesDiffer) {
        setSelectedDateInternal(newValidSelectedDate);
        // Si la fecha seleccionada cambia desde fuera, actualizamos la vista actual
        // para que contenga esa fecha (si es válida)
        if (newValidSelectedDate) {
            setCurrentDateForView(newValidSelectedDate);
        }
    }
  }, [selectedDate]); // Solo depende del cambio de la prop


  // --- Calcular intervalo de fechas a mostrar ---
  const currentInterval = useMemo(() => {
    let start: Date;
    let end: Date;
    const weekOptions = { locale: es }; // Asegura que la semana empieza en Lunes

    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDateForView);
      start = startOfWeek(monthStart, weekOptions);
      end = endOfWeek(endOfMonth(monthStart), weekOptions); // Usamos monthStart para asegurar 6 semanas max
    } else { // 'week'
      start = startOfWeek(currentDateForView, weekOptions);
      end = endOfWeek(currentDateForView, weekOptions);
    }
    return { start, end };
  }, [viewMode, currentDateForView]);


  // --- Generar días del calendario basado en el intervalo ---
  const generateCalendarDays = useCallback(() => {
    const today = startOfDay(new Date());
    const busyDatesSet = new Set(busyDays);
    const monthForStyling = startOfMonth(currentDateForView); // Mes de referencia para estilo 'outside'

    const days: CalendarDay[] = eachDayOfInterval(currentInterval).map((date) => {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const isSelected = selectedDateInternal ? isSameDay(date, selectedDateInternal) : false;
      const isUnavailable = busyDatesSet.has(formattedDate);
      const isPastCheck = isBefore(date, today);

      return {
        date: date,
        dayOfMonth: date.getDate(),
        // 'isCurrentMonth' ahora solo sirve para el estilo 'outside' en vista de mes
        isCurrentMonth: isSameMonth(date, monthForStyling),
        // 'isCurrentView' indica si el día pertenece al intervalo visible (importante en week view)
        isCurrentView: viewMode === 'week' || isSameMonth(date, monthForStyling),
        isSelected: isSelected,
        isUnavailable: isUnavailable,
        isPast: isPastCheck,
        isToday: isSameDay(date, today),
      };
    });

    setCalendarDays(days);
  }, [currentInterval, busyDays, selectedDateInternal, viewMode, currentDateForView]); // Dependencias


  // --- Regenerar días cuando cambian las dependencias ---
  useEffect(() => {
    generateCalendarDays();
  }, [generateCalendarDays]);

  // --- Navegación (adaptada a viewMode) ---
  const goToPrev = () => {
    setCurrentDateForView((prev) =>
      viewMode === 'month' ? subMonths(prev, 1) : subWeeks(prev, 1)
    );
  };

  const goToNext = () => {
     setCurrentDateForView((prev) =>
      viewMode === 'month' ? addMonths(prev, 1) : addWeeks(prev, 1)
    );
  };

  // --- Manejar Selección ---
  const handleDateSelect = (day: CalendarDay) => {
    // Solo permitir seleccionar días que pertenezcan a la vista actual
    // (evita seleccionar días 'outside' grises en vista de mes también)
    // y que no estén pasados o no disponibles
    if (!day.isCurrentView || day.isPast || day.isUnavailable) {
      return;
    }
    const newSelectedDate = day.date;
    setSelectedDateInternal(newSelectedDate);
    onDateChange(format(newSelectedDate, 'yyyy-MM-dd'));
    // Opcional: actualizar la vista para centrarse en la semana/mes seleccionado
    // setCurrentDateForView(newSelectedDate);
  };

  // --- Renderizado ---
  return (
    // Contenedor principal del calendario
    <div className={styles.calendarContainer}>
      {/* Controles Mes/Semanas */}
      <div className={styles.calendarViewControls}>
        <button
            type="button"
            className={`${styles.controlButton} ${viewMode === 'month' ? styles.active : ''}`}
            onClick={() => setViewMode('month')}
        >
          Mes
        </button>
        <button
            type="button"
            className={`${styles.controlButton} ${viewMode === 'week' ? styles.active : ''}`}
            onClick={() => setViewMode('week')}
        >
          Semanas
        </button>
      </div>

       {/* Contenedor para Navegación y Grid (para aplicar fondo y padding) */}
       <div className={styles.calendarGridContainer}>
            {/* Navegación del Mes/Semana */}
            <div className={styles.calendarNavigation}>
                <button
                type="button"
                onClick={goToPrev}
                className={styles.calendarNavButton}
                aria-label="Anterior"
                >
                <IconArrowLeft size={18} /> {/* Ajusta tamaño icono */}
                </button>
                <span className={styles.calendarMonthYear}>
                    {/* Muestra siempre Mes y Año */}
                    {format(currentDateForView, 'MMMM yyyy', { locale: es })}
                    {/* Opcional: Mostrar semana en week view
                    {viewMode === 'week'
                        ? `Semana del ${format(currentInterval.start, 'd \'de\' MMMM', { locale: es })}`
                        : format(currentDateForView, 'MMMM yyyy', { locale: es })
                    }
                    */}
                </span>
                <button
                type="button"
                onClick={goToNext}
                className={styles.calendarNavButton}
                aria-label="Siguiente"
                >
                <IconArrowRight size={18} /> {/* Ajusta tamaño icono */}
                </button>
            </div>

            {/* Cabecera Días Semana */}
            <div className={styles.calendarWeekdays}>
                {daysOfWeek.map((dayName) => (
                <div key={dayName} className={styles.calendarWeekday}>
                    {dayName}
                </div>
                ))}
            </div>

            {/* Grid del Calendario */}
            <div className={styles.calendarDaysGrid}>
                {calendarDays.map((day, index) => {
                const dayClasses = [
                    styles.calendarDayButton,
                    // Aplica 'outsideDay' solo en vista de mes y si no es del mes de referencia
                    (viewMode === 'month' && !day.isCurrentMonth) ? styles.outsideDay : '',
                    // Aplica 'disabledDay' si no es de la vista actual O es pasado O no disponible
                    (!day.isCurrentView || day.isPast || day.isUnavailable) ? styles.disabledDay : '',
                    day.isToday ? styles.today : '',
                    day.isSelected ? styles.selectedDay : '',
                    day.isUnavailable ? styles.busyDay : '',
                ].filter(Boolean).join(' ');

                const cellClasses = styles.calendarDayCell;

                return (
                    <div key={index} className={cellClasses}>
                    <button
                        type="button"
                        onClick={() => handleDateSelect(day)}
                        // Deshabilita si no pertenece a la vista, es pasado o no disponible
                        disabled={!day.isCurrentView || day.isPast || day.isUnavailable}
                        className={dayClasses}
                        aria-label={format(day.date, 'PPPP', { locale: es })} // Añade accesibilidad
                    >
                        {day.dayOfMonth}
                    </button>
                    </div>
                );
                })}
            </div>
       </div> {/* Fin calendarGridContainer */}
    </div> // Fin calendarContainer
  );
};

export default CalendarPicker;