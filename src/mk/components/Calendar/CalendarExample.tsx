"use client";
import { useState } from "react";
import Calendar from "./Calendar";
import styles from "./calendarExample.module.css";

export interface Reservation {
  id: string | number;
  date: string; // Formato ISO "YYYY-MM-DD"
  start_time: string; // Formato "HH:MM"
  end_time: string; // Formato "HH:MM"
  status: string; // Estado de la reserva
  owner_id?: string | number; // ID del propietario que reservó
  owner_name?: string; // Nombre del propietario
}

interface CalendarExampleProps {
  area_id: string | number;
  initialReservations?: Reservation[];
}

const CalendarExample = ({
  area_id,
  initialReservations = [],
}: CalendarExampleProps) => {
  // Estado para manejar las reservas
  const [reservations, setReservations] =
    useState<Reservation[]>(initialReservations);
  // Estado para manejar el tipo de vista (mensual o semanal)
  const [viewType, setViewType] = useState<"M" | "W">("M");
  // Estado para manejar la fecha seleccionada
  const [selectedDate, setSelectedDate] = useState<string | undefined>(
    undefined
  );
  // Estado para manejar la hora seleccionada
  const [selectedTime, setSelectedTime] = useState<string | undefined>(
    undefined
  );

  // Función para manejar la selección de fecha
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    console.log(`Fecha seleccionada: ${date}`);
  };

  // Función para manejar la selección de hora
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    console.log(`Hora seleccionada: ${time}`);
  };

  // Función para cambiar el tipo de vista
  const toggleViewType = () => {
    setViewType(viewType === "M" ? "W" : "M");
  };

  return (
    <div className={styles.exampleContainer}>
      <div className={styles.controlsContainer}>
        <h2 className={styles.title}>Calendario de Reservas</h2>
        <div className={styles.controls}>
          <button className={styles.viewToggle} onClick={toggleViewType}>
            Ver {viewType === "M" ? "Semanal" : "Mensual"}
          </button>
        </div>
      </div>

      <Calendar
        area_id={area_id}
        reservations={reservations}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        viewType={viewType}
        onDateSelect={handleDateSelect}
        onTimeSelect={handleTimeSelect}
      />
      {selectedDate && (
        <div className={styles.selectionInfo}>
          <p>Fecha seleccionada: {selectedDate}</p>
          {selectedTime && <p>Hora seleccionada: {selectedTime}</p>}
        </div>
      )}
    </div>
  );
};

export default CalendarExample;
