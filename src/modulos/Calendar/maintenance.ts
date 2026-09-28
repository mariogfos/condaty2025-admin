import { format } from "date-fns";

export type CalendarMaintenanceDraft = {
  areaId: string;
  scope: "day" | "range";
  endDate: string;
  reason: string;
};

const isDateKey = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && format(date, "yyyy-MM-dd") === value;
};

export const buildCalendarMaintenancePayload = (
  draft: CalendarMaintenanceDraft,
  startDate: string,
  now = new Date(),
) => {
  const today = format(now, "yyyy-MM-dd");
  const endDate = draft.scope === "day" ? startDate : draft.endDate;
  const reason = draft.reason.trim();

  if (!draft.areaId) throw new Error("Selecciona un área social.");
  if (!isDateKey(startDate) || startDate < today) {
    throw new Error("Selecciona una fecha de inicio válida y futura.");
  }
  if (!isDateKey(endDate) || endDate < startDate) {
    throw new Error("La fecha final debe ser igual o posterior a la inicial.");
  }
  if (!reason) throw new Error("Escribe el motivo del mantenimiento.");

  const startTime = startDate === today ? format(now, "HH:mm:ss") : "00:00:00";
  if (startDate === endDate && startTime >= "23:59:59") {
    throw new Error("Ya terminó el día seleccionado.");
  }

  return {
    area_id: draft.areaId,
    date_at: `${startDate} ${startTime}`,
    date_end: `${endDate} 23:59:59`,
    reason,
  };
};
