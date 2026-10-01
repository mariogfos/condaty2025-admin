/**
 * El cuerpo del `POST v3/reservations/area-blocked` que manda el Calendario.
 *
 * 🔴 No lee el reloj. El front sólo PRESENTA la hora: el API recorta al
 * "ahora" del condominio un inicio que ya pasó, rechaza un período que ya
 * terminó y cancela (y avisa) las reservas que se cruzan. Por eso el bloqueo
 * va de las 00:00:00 del primer día a las 23:59:59 del último, siempre igual
 * a cualquier hora en que se arme.
 */
export type MaintenanceDraft = {
  areaId: string;
  scope: "day" | "range";
  endDate: string;
  reason: string;
};

export type MaintenancePayload = {
  area_id: string;
  date_at: string;
  date_end: string;
  reason: string;
};

// Valida el día del calendario sin zona: `Date.UTC` no depende del navegador.
const isDateKey = (value: string): boolean => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

export const buildMaintenancePayload = (
  draft: MaintenanceDraft,
  startDayKey: string,
): MaintenancePayload => {
  const endDayKey = draft.scope === "day" ? startDayKey : draft.endDate;
  const reason = draft.reason.trim();

  if (!draft.areaId) throw new Error("Selecciona un área social.");
  if (!isDateKey(startDayKey)) throw new Error("La fecha de inicio no es válida.");
  if (!isDateKey(endDayKey) || endDayKey < startDayKey) {
    throw new Error("La fecha final debe ser igual o posterior a la inicial.");
  }
  if (!reason) throw new Error("Escribe el motivo del mantenimiento.");

  return {
    area_id: draft.areaId,
    date_at: `${startDayKey} 00:00:00`,
    date_end: `${endDayKey} 23:59:59`,
    reason,
  };
};
