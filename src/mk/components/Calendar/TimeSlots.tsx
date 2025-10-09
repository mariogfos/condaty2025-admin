"use client";
import { useState, useEffect } from "react";
import styles from "./timeSlots.module.css";

interface Reservation {
  id: string | number;
  date: string; // Formato ISO "YYYY-MM-DD"
  start_time: string; // Formato "HH:MM"
  end_time: string; // Formato "HH:MM"
  status: string; // Estado de la reserva
}

interface TimeSlotsProps {
  date: string; // Fecha seleccionada en formato ISO "YYYY-MM-DD"
  reservations: Reservation[]; // Reservas existentes para esta fecha
  startHour?: number; // Hora de inicio para mostrar slots (por defecto 8:00 AM)
  endHour?: number; // Hora de fin para mostrar slots (por defecto 10:00 PM)
  interval?: number; // Intervalo en minutos entre slots (por defecto 30 min)
  onTimeSelect?: (startTime: string, endTime: string) => void; // Callback cuando se selecciona un horario
}

const TimeSlots = ({
  date,
  reservations = [],
  startHour = 8,
  endHour = 22,
  interval = 30,
  onTimeSelect,
}: TimeSlotsProps) => {
  // Estado para los slots de tiempo disponibles
  const [timeSlots, setTimeSlots] = useState<
    Array<{
      startTime: string;
      endTime: string;
      isAvailable: boolean;
    }>
  >([]);

  // Estado para el slot seleccionado
  const [selectedSlot, setSelectedSlot] = useState<{
    startTime: string;
    endTime: string;
  } | null>(null);

  // Filtrar reservas para la fecha seleccionada
  const dayReservations = reservations.filter((res) => res.date === date);

  // Generar slots de tiempo y verificar disponibilidad
  useEffect(() => {
    generateTimeSlots();
  }, [date, reservations]);

  const generateTimeSlots = () => {
    const slots = [];
    const totalMinutes = (endHour - startHour) * 60;
    const totalSlots = totalMinutes / interval;

    for (let i = 0; i < totalSlots; i++) {
      const startMinutes = startHour * 60 + i * interval;
      const endMinutes = startMinutes + interval;

      const startHours = Math.floor(startMinutes / 60);
      const startMins = startMinutes % 60;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;

      const startTime = `${startHours.toString().padStart(2, "0")}:${startMins
        .toString()
        .padStart(2, "0")}`;
      const endTime = `${endHours.toString().padStart(2, "0")}:${endMins
        .toString()
        .padStart(2, "0")}`;

      // Verificar si el slot está disponible (no se superpone con reservas existentes)
      const isAvailable = !isSlotOverlapping(
        startTime,
        endTime,
        dayReservations
      );

      slots.push({
        startTime,
        endTime,
        isAvailable,
      });
    }

    setTimeSlots(slots);
  };

  // Verificar si un slot se superpone con alguna reserva existente
  const isSlotOverlapping = (
    startTime: string,
    endTime: string,
    reservations: Reservation[]
  ) => {
    return reservations.some((reservation) => {
      // Convertir horas a minutos para facilitar la comparación
      const [startHour, startMin] = startTime.split(":").map(Number);
      const [endHour, endMin] = endTime.split(":").map(Number);
      const [resStartHour, resStartMin] = reservation.start_time
        .split(":")
        .map(Number);
      const [resEndHour, resEndMin] = reservation.end_time
        .split(":")
        .map(Number);

      const slotStart = startHour * 60 + startMin;
      const slotEnd = endHour * 60 + endMin;
      const resStart = resStartHour * 60 + resStartMin;
      const resEnd = resEndHour * 60 + resEndMin;

      // Verificar superposición
      return slotStart < resEnd && slotEnd > resStart;
    });
  };

  // Manejar la selección de un slot de tiempo
  const handleSlotSelect = (startTime: string, endTime: string) => {
    setSelectedSlot({ startTime, endTime });
    if (onTimeSelect) {
      onTimeSelect(startTime, endTime);
    }
  };

  // Formatear hora para mostrar en formato 12h
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${formattedHour}:${minutes} ${period}`;
  };

  return (
    <div className={styles.timeSlotsContainer}>
      <h3 className={styles.timeSlotsTitle}>Horarios Disponibles</h3>
      <div className={styles.timeSlotsGrid}>
        {timeSlots.map((slot, index) => (
          <div
            key={index}
            className={`
              ${styles.timeSlot} 
              ${!slot.isAvailable ? styles.unavailable : ""}
              ${
                selectedSlot && selectedSlot.startTime === slot.startTime
                  ? styles.selected
                  : ""
              }
            `}
            onClick={() =>
              slot.isAvailable && handleSlotSelect(slot.startTime, slot.endTime)
            }
          >
            <span className={styles.timeSlotText}>
              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
            </span>
            {!slot.isAvailable && (
              <span className={styles.unavailableText}>Reservado</span>
            )}
          </div>
        ))}
      </div>
      {timeSlots.length === 0 && (
        <p className={styles.noSlots}>
          No hay horarios disponibles para esta fecha
        </p>
      )}
    </div>
  );
};

export default TimeSlots;
