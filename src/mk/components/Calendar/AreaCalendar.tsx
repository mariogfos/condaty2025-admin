"use client";
import { useState, useEffect } from "react";
import Calendar from "./Calendar";
import TimeSlots from "./TimeSlots";
import styles from "./areaCalendar.module.css";

interface Reservation {
  id: string | number;
  date: string; // Formato ISO "YYYY-MM-DD"
  start_time: string; // Formato "HH:MM"
  end_time: string; // Formato "HH:MM"
  status: string; // Estado de la reserva
  owner_id?: string | number; // ID del propietario que reservó
  owner_name?: string; // Nombre del propietario
}

interface AreaCalendarProps {
  area_id: string | number;
  reservations: Reservation[];
  pretendedDate?: string; // Fecha pretendida en formato ISO "YYYY-MM-DD"
  pretendedTime?: string; // Hora pretendida en formato "HH:MM"
  viewType: "M" | "W"; // M: mensual, W: semanal
  onReservationSelect?: (
    date: string,
    startTime: string,
    endTime: string
  ) => void;
}

const AreaCalendar = ({
  area_id,
  reservations = [],
  pretendedDate,
  pretendedTime,
  viewType = "M",
  onReservationSelect,
}: AreaCalendarProps) => {
  // Estados para manejar la selección
  const [selectedDate, setSelectedDate] = useState<string | undefined>(
    pretendedDate
  );
  const [selectedStartTime, setSelectedStartTime] = useState<
    string | undefined
  >(undefined);
  const [selectedEndTime, setSelectedEndTime] = useState<string | undefined>(
    undefined
  );
  const [currentViewType, setCurrentViewType] = useState<"M" | "W">(viewType);

  // Actualizar el estado cuando cambian las props
  useEffect(() => {
    if (pretendedDate) {
      setSelectedDate(pretendedDate);
    }
    setCurrentViewType(viewType);
  }, [pretendedDate, viewType]);

  // Manejar la selección de fecha en el calendario
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    // Resetear la selección de hora cuando se cambia la fecha
    setSelectedStartTime(undefined);
    setSelectedEndTime(undefined);
  };

  // Manejar la selección de horario
  const handleTimeSelect = (startTime: string, endTime: string) => {
    setSelectedStartTime(startTime);
    setSelectedEndTime(endTime);

    // Notificar al componente padre sobre la selección completa
    if (selectedDate && onReservationSelect) {
      onReservationSelect(selectedDate, startTime, endTime);
    }
  };

  // Cambiar el tipo de vista
  const handleViewTypeChange = (type: "M" | "W") => {
    setCurrentViewType(type);
  };

  return (
    <div className={styles.areaCalendarContainer}>
      <div className={styles.viewTypeControls}>
        <button
          className={`${styles.viewTypeButton} ${
            currentViewType === "M" ? styles.active : ""
          }`}
          onClick={() => handleViewTypeChange("M")}
        >
          Vista Mensual
        </button>
        <button
          className={`${styles.viewTypeButton} ${
            currentViewType === "W" ? styles.active : ""
          }`}
          onClick={() => handleViewTypeChange("W")}
        >
          Vista Semanal
        </button>
      </div>

      <div className={styles.calendarSection}>
        <Calendar
          area_id={area_id}
          reservations={reservations}
          selectedDate={selectedDate}
          viewType={currentViewType}
          onDateSelect={handleDateSelect}
        />
      </div>

      {selectedDate && (
        <div className={styles.timeSlotsSection}>
          <TimeSlots
            date={selectedDate}
            reservations={reservations}
            onTimeSelect={handleTimeSelect}
          />
        </div>
      )}

      {selectedDate && selectedStartTime && selectedEndTime && (
        <div className={styles.selectionSummary}>
          <h3 className={styles.summaryTitle}>Resumen de Selección</h3>
          <div className={styles.summaryDetails}>
            <p>
              <strong>Fecha:</strong> {selectedDate}
            </p>
            <p>
              <strong>Horario:</strong> {selectedStartTime} - {selectedEndTime}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AreaCalendar;
