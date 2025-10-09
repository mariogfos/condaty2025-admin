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

// --- Interfaz Día Modificada ---
interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean; // Sigue siendo relevante para estilo 'outside' en vista mes
  isCurrentView: boolean; // Nuevo: para indicar si pertenece al mes/semana actual visible
  isPartiallyBusy: boolean; // NUEVA: Indica si está en busyDays (ocupación parcial)
  isSelected: boolean;
  isPast: boolean;       // Indica si deshabilitar
  isToday: boolean;
}

// --- Props ---
interface CalendarPickerProps {
  selectedDate?: string; // 'yyyy-MM-dd'
  onDateChange: (dateString: string | undefined) => void;
  busyDays?: string[]; // 'yyyy-MM-dd' <- Estos indican ocupación parcial
}

const CalendarPicker: React.FC<CalendarPickerProps> = ({
  selectedDate,
  onDateChange,
  busyDays = [],
}) => {
  // --- Estados ---
  console.log("busyDays", busyDays);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [currentDateForView, setCurrentDateForView] = useState<Date>(() => {
      const initialDate = selectedDate && isValid(parse(selectedDate, 'yyyy-MM-dd', new Date()))
          ? parse(selectedDate, 'yyyy-MM-dd', new Date())
          : new Date();
      // Asegurarse que la fecha inicial no sea en el pasado para la vista inicial si no hay selección
       // Comentado por ahora, podría ser útil si no quieres empezar en un mes pasado por defecto
      // const today = startOfDay(new Date());
      // return isBefore(initialDate, today) && !selectedDate ? today : initialDate;
      return initialDate;
  });
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
        datesDiffer = false; // Both are null/invalid, no difference
    }

    if (datesDiffer) {
        setSelectedDateInternal(newValidSelectedDate);
        // Si la fecha seleccionada cambia desde fuera y es válida,
        // ajusta la vista actual para que contenga esa fecha.
        if (newValidSelectedDate) {
            setCurrentDateForView(newValidSelectedDate);
        }
    }
  // Only re-run if the selectedDate prop changes externally
  }, [selectedDate]);


  // --- Calcular intervalo de fechas a mostrar ---
  const currentInterval = useMemo(() => {
    let start: Date;
    let end: Date;
    const weekOptions = { locale: es }; // Asegura que la semana empieza en Lunes

    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDateForView);
      start = startOfWeek(monthStart, weekOptions);
      // Calculamos el final basado en el inicio para asegurar un número fijo de semanas si es necesario
      // O usar endOfWeek(endOfMonth(monthStart), weekOptions) si quieres que siempre termine al final de la última semana del mes.
      // Por simplicidad, usemos endOfMonth:
      const monthEnd = endOfMonth(monthStart);
      end = endOfWeek(monthEnd, weekOptions);
    } else { // 'week'
      start = startOfWeek(currentDateForView, weekOptions);
      end = endOfWeek(currentDateForView, weekOptions);
    }
    return { start, end };
  }, [viewMode, currentDateForView]);


  // --- Generar días del calendario basado en el intervalo ---
  const generateCalendarDays = useCallback(() => {
    const today = startOfDay(new Date());
    // Usamos un Set para buscar eficientemente los días parcialmente ocupados
    const partiallyBusyDatesSet = new Set(busyDays);
    const monthForStyling = startOfMonth(currentDateForView); // Mes de referencia para estilo 'outside'

    const days: CalendarDay[] = eachDayOfInterval(currentInterval).map((date) => {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const isSelected = selectedDateInternal ? isSameDay(date, selectedDateInternal) : false;
      // Determina si el día está en la lista `busyDays`
      const isPartiallyBusy = partiallyBusyDatesSet.has(formattedDate);
      // Determina si el día es anterior a hoy
      const isPastCheck = isBefore(date, today);
      // Determina si el día está fuera del mes actual (para estilo gris en vista de mes)
      const isOutsideMonth = !isSameMonth(date, monthForStyling);
      // Un día está en la "vista actual" si NO está fuera del mes (en vista mes)
      // En vista semana, todos los días del intervalo están en la vista actual.
      const isCurrentViewCheck = viewMode === 'week' || !isOutsideMonth;

      return {
        date: date,
        dayOfMonth: date.getDate(),
        isCurrentMonth: !isOutsideMonth, // Mantenido para posible estilo 'outside'
        isCurrentView: isCurrentViewCheck, // Usado para lógica de habilitación/deshabilitación
        isSelected: isSelected,
        isPartiallyBusy: isPartiallyBusy, // Indica si mostrar el punto rojo
        isPast: isPastCheck,           // Indica si deshabilitar
        isToday: isSameDay(date, today),
      };
    });

    setCalendarDays(days);
  // Dependencias: Regenerar si cambia el intervalo, los días ocupados, la selección interna, etc.
  }, [currentInterval, busyDays, selectedDateInternal, viewMode, currentDateForView]);


  // --- Regenerar días cuando cambian las dependencias ---
  useEffect(() => {
    generateCalendarDays();
  }, [generateCalendarDays]); // generateCalendarDays ya incluye sus dependencias

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
    // Permitir seleccionar SOLO si:
    // 1. Pertenece a la vista actual (isCurrentView es true)
    // 2. NO está en el pasado (isPast es false)
    // La condición isPartiallyBusy ya NO impide la selección aquí.
    if (!day.isCurrentView || day.isPast) {
      // console.log("Selection prevented: Outside view or past date.", day); // Log opcional
      return; // No hacer nada si no es seleccionable
    }

    // Si es seleccionable, actualiza el estado interno y llama a onDateChange
    const newSelectedDate = day.date;
    setSelectedDateInternal(newSelectedDate); // Actualiza estado interno
    onDateChange(format(newSelectedDate, 'yyyy-MM-dd')); // Notifica al padre

    // Opcional: Si quieres que la vista se centre en la semana/mes del día seleccionado
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
                // Determina si el día está REALMENTE deshabilitado (no seleccionable)
                const isTrulyDisabled = !day.isCurrentView || day.isPast;

                // Construye las clases CSS para el botón del día
                const dayClasses = [
                    styles.calendarDayButton,
                    // Estilo si está fuera del mes/semana visible (puede ser redundante si isTrulyDisabled ya lo cubre)
                    !day.isCurrentView ? styles.outsideDay : '',
                    // Estilo si está realmente deshabilitado
                    isTrulyDisabled ? styles.disabledDay : '',
                    // Estilo si es hoy
                    day.isToday ? styles.today : '',
                    // Estilo si está seleccionado
                    day.isSelected ? styles.selectedDay : '',
                    // NUEVO ESTILO: Aplicar solo si está parcialmente ocupado Y NO está deshabilitado
                    (day.isPartiallyBusy && !isTrulyDisabled) ? styles.partiallyBusyDay : '',
                ].filter(Boolean).join(' '); // filter(Boolean) elimina entradas vacías

                // Clases para la celda contenedora (si es necesario)
                const cellClasses = styles.calendarDayCell;

                return (
                    <div key={index} className={cellClasses}>
                    <button
                        type="button"
                        onClick={() => handleDateSelect(day)}
                        // Deshabilita el botón SÓLO si isTrulyDisabled es true
                        disabled={isTrulyDisabled}
                        className={dayClasses}
                        // Añade un aria-label más descriptivo
                        aria-label={`Seleccionar ${format(day.date, 'PPPP', { locale: es })}${day.isPartiallyBusy && !isTrulyDisabled ? ' (con reservas)' : ''}${isTrulyDisabled ? ' (no disponible)' : ''}`}
                    >
                        {day.dayOfMonth}
                        {/* El punto rojo se añade vía CSS con ::after en la clase .partiallyBusyDay */}
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