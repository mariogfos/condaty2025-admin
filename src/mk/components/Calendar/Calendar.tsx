"use client";
import { useEffect, useState } from "react";
import styles from "./calendar.module.css";
import { DAYS, MONTHS, MONTHS_S } from "@/mk/utils/date";

interface Reservation {
  id: string | number;
  date: string; // Formato ISO "YYYY-MM-DD"
  start_time: string; // Formato "HH:MM"
  end_time: string; // Formato "HH:MM"
  status: string; // Estado de la reserva
  owner_id?: string | number; // ID del propietario que reservó
  owner_name?: string; // Nombre del propietario
}

interface CalendarProps {
  area_id: string | number;
  reservations: Reservation[];
  selectedDate?: string; // Fecha seleccionada en formato ISO "YYYY-MM-DD"
  selectedTime?: string; // Hora seleccionada en formato "HH:MM"
  viewType: "M" | "W"; // M: mensual, W: semanal
  onDateSelect?: (date: string) => void; // Callback cuando se selecciona una fecha
  onTimeSelect?: (time: string) => void; // Callback cuando se selecciona una hora
}

const Calendar = ({
  area_id,
  reservations = [],
  selectedDate,
  selectedTime,
  viewType = "M",
  onDateSelect,
  onTimeSelect,
}: CalendarProps) => {
  // Estados para manejar el calendario
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(
    selectedDate ? new Date(selectedDate) : null
  );

  // Función para generar los días del calendario según el tipo de vista
  useEffect(() => {
    generateCalendarDays();
  }, [currentDate, viewType]);

  const generateCalendarDays = () => {
    const days: Date[] = [];

    if (viewType === "M") {
      // Vista mensual
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      // Primer día del mes
      const firstDay = new Date(year, month, 1);
      // Último día del mes
      const lastDay = new Date(year, month + 1, 0);

      // Obtener el día de la semana del primer día (0 = Domingo, 1 = Lunes, ...)
      const firstDayOfWeek = firstDay.getDay();

      // Agregar días del mes anterior para completar la primera semana
      for (let i = firstDayOfWeek; i > 0; i--) {
        const prevMonthDay = new Date(year, month, 1 - i);
        days.push(prevMonthDay);
      }

      // Agregar todos los días del mes actual
      for (let i = 1; i <= lastDay.getDate(); i++) {
        const currentMonthDay = new Date(year, month, i);
        days.push(currentMonthDay);
      }

      // Calcular cuántos días necesitamos del mes siguiente
      const remainingDays = 42 - days.length; // 6 semanas * 7 días = 42

      // Agregar días del mes siguiente para completar las 6 semanas
      for (let i = 1; i <= remainingDays; i++) {
        const nextMonthDay = new Date(year, month + 1, i);
        days.push(nextMonthDay);
      }
    } else {
      // Vista semanal
      const currentDay = currentDate.getDay(); // 0 = Domingo, 1 = Lunes, ...

      // Calcular el primer día de la semana (Domingo)
      const firstDayOfWeek = new Date(currentDate);
      firstDayOfWeek.setDate(currentDate.getDate() - currentDay);

      // Agregar los 7 días de la semana
      for (let i = 0; i < 7; i++) {
        const day = new Date(firstDayOfWeek);
        day.setDate(firstDayOfWeek.getDate() + i);
        days.push(day);
      }
    }

    setCalendarDays(days);
  };

  // Función para verificar si una fecha tiene reservas
  const hasReservations = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return reservations.some((reservation) => reservation.date === dateStr);
  };

  // Función para obtener las reservas de un día específico
  const getDayReservations = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    console.log("dateStr", dateStr);
    return reservations.filter((reservation) => reservation.date === dateStr);
  };

  // Función para manejar el cambio de mes o semana
  const handlePeriodChange = (increment: number) => {
    const newDate = new Date(currentDate);
    if (viewType === "M") {
      newDate.setMonth(currentDate.getMonth() + increment);
    } else {
      newDate.setDate(currentDate.getDate() + 7 * increment);
    }
    setCurrentDate(newDate);
  };

  // Función para manejar la selección de un día
  const handleDaySelect = (day: Date) => {
    setSelectedDay(day);
    if (onDateSelect) {
      onDateSelect(day.toISOString().split("T")[0]);
    }
  };

  // Función para formatear la hora en formato 12 horas
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${formattedHour}:${minutes} ${period}`;
  };

  // Renderizar el encabezado del calendario
  const renderHeader = () => {
    if (viewType === "M") {
      return (
        <div className={styles.calendarHeader}>
          <button
            className={styles.navButton}
            onClick={() => handlePeriodChange(-1)}
          >
            &lt;
          </button>
          <h2 className={styles.calendarTitle}>
            {MONTHS[currentDate.getMonth() + 1]} {currentDate.getFullYear()}
          </h2>
          <button
            className={styles.navButton}
            onClick={() => handlePeriodChange(1)}
          >
            &gt;
          </button>
        </div>
      );
    } else {
      const firstDay = calendarDays[0];
      const lastDay = calendarDays[6];
      const sameMonth = firstDay.getMonth() === lastDay.getMonth();
      const formattedPeriod = sameMonth
        ? `${firstDay.getDate()} - ${lastDay.getDate()} de ${
            MONTHS[firstDay.getMonth() + 1]
          } ${firstDay.getFullYear()}`
        : `${firstDay.getDate()} ${
            MONTHS_S[firstDay.getMonth() + 1]
          } - ${lastDay.getDate()} ${
            MONTHS_S[lastDay.getMonth() + 1]
          } ${firstDay.getFullYear()}`;

      return (
        <div className={styles.calendarHeader}>
          <button
            className={styles.navButton}
            onClick={() => handlePeriodChange(-1)}
          >
            &lt;
          </button>
          <h2 className={styles.calendarTitle}>{formattedPeriod}</h2>
          <button
            className={styles.navButton}
            onClick={() => handlePeriodChange(1)}
          >
            &gt;
          </button>
        </div>
      );
    }
  };

  // Renderizar los días de la semana
  const renderDaysOfWeek = () => {
    return (
      <div className={styles.daysOfWeek}>
        {DAYS.map((day, index) => (
          <div key={index} className={styles.dayOfWeek}>
            {day.substring(0, 3)}
          </div>
        ))}
      </div>
    );
  };

  // Renderizar los días del calendario
  const renderCalendarDays = () => {
    return (
      <div className={styles.calendarGrid}>
        {calendarDays.map((day, index) => {
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isToday = day.toDateString() === new Date().toDateString();
          const isSelected =
            selectedDay && day.toDateString() === selectedDay.toDateString();
          const hasReservation = hasReservations(day);

          return (
            <div
              key={index}
              className={`${styles.calendarDay} 
                ${isCurrentMonth ? "" : styles.otherMonth} 
                ${isToday ? styles.today : ""} 
                ${isSelected ? styles.selected : ""} 
                ${hasReservation ? styles.reserved : ""}`}
              onClick={() => handleDaySelect(day)}
            >
              <span className={styles.dayNumber}>{day.getDate()}</span>
              {hasReservation && (
                <div className={styles.reservationIndicator}></div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Renderizar la vista detallada de las reservas del día seleccionado
  const renderDayDetail = () => {
    if (!selectedDay) return null;

    const dayReservations = getDayReservations(selectedDay);

    return (
      <div className={styles.dayDetail}>
        <h3 className={styles.dayDetailTitle}>
          Reservas para el {selectedDay.getDate()} de{" "}
          {MONTHS[selectedDay.getMonth() + 1]}
        </h3>
        {dayReservations.length > 0 ? (
          <div className={styles.reservationsList}>
            {dayReservations.map((reservation, index) => (
              <div key={index} className={styles.reservationItem}>
                <div className={styles.reservationTime}>
                  {formatTime(reservation.start_time)} -{" "}
                  {formatTime(reservation.end_time)}
                </div>
                <div className={styles.reservationInfo}>
                  <span className={styles.reservationOwner}>
                    {reservation.owner_name || "Reservado"}
                  </span>
                  <span
                    className={`${styles.reservationStatus} ${
                      styles[`status${reservation.status}`]
                    }`}
                  >
                    {reservation.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.noReservations}>No hay reservas para este día</p>
        )}
      </div>
    );
  };

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.calendarControls}>
        <div className={styles.viewTypeSelector}>
          <button
            className={`${styles.viewTypeButton} ${
              viewType === "M" ? styles.active : ""
            }`}
            onClick={() => setCurrentDate(new Date())}
          >
            Hoy
          </button>
          <button
            className={`${styles.viewTypeButton} ${
              viewType === "M" ? styles.active : ""
            }`}
          >
            Mes
          </button>
          <button
            className={`${styles.viewTypeButton} ${
              viewType === "W" ? styles.active : ""
            }`}
          >
            Semana
          </button>
        </div>
      </div>

      {renderHeader()}
      {renderDaysOfWeek()}
      {renderCalendarDays()}
      {renderDayDetail()}
    </div>
  );
};

export default Calendar;
