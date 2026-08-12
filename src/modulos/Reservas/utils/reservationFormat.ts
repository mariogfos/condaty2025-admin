import { format, formatDistanceToNowStrict, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { getFullName } from "@/mk/utils/string";
import { RESERVATION_DETAIL_COPY } from "../config/reservas.constants";
import type {
  ReservationArea,
  ReservationPeriod,
  ReservationResident,
} from "../Type/ReservaType";

/**
 * Cómo se escriben en pantalla los datos de una reserva.
 *
 * Funciones puras: no leen estado, no piden nada al API y no devuelven JSX.
 * Viven separadas del componente para que se puedan medir con un test sin
 * montar un modal entero.
 */

/** El nombre de una persona, o el texto de reemplazo si no hay persona. */
export const getActorName = (
  actor?: ReservationResident | string | null,
  fallback = "",
) => {
  if (!actor) return fallback;
  if (typeof actor === "string") return actor || fallback;

  const fullName = getFullName({
    name: actor.name || undefined,
    middle_name: actor.middle_name || undefined,
    last_name: actor.last_name || undefined,
    mother_last_name: actor.mother_last_name || undefined,
  });

  return fullName || fallback;
};

/** Un instante ISO como "3 de ago 2026, 14:30". Si no se puede, se devuelve crudo. */
export const formatDateTimeValue = (value?: string | null) => {
  if (!value) return "-";

  try {
    return format(parseISO(value), "d 'de' MMM yyyy, HH:mm", { locale: es });
  } catch {
    return value;
  }
};

/** "hace 3 días · 3 de ago 2026, 14:30". */
export const formatRequestMoment = (value?: string | null) => {
  if (!value) return "-";

  try {
    return `${formatDistanceToNowStrict(parseISO(value), {
      addSuffix: true,
      locale: es,
    })} · ${formatDateTimeValue(value)}`;
  } catch {
    return formatDateTimeValue(value);
  }
};

/**
 * La fecha del evento, en largo.
 *
 * 🔴 Lo que protege el borde del día acá es `parseISO`, NO el `T00:00:00`.
 * `reservations.date_at` es un DÍA calendario, no un instante. Medido el
 * 2026-08-12 con `TZ=America/La_Paz` (UTC-4):
 *
 *     new Date("2026-08-12")      → 11 de agosto  ← el bug
 *     parseISO("2026-08-12")      → 12 de agosto
 *     parseISO("2026-08-12T00:00:00") → 12 de agosto
 *
 * `new Date` con una fecha sin hora la interpreta como medianoche UTC y
 * retrocede un día en cualquier zona al oeste de Greenwich; `parseISO` la
 * interpreta como medianoche LOCAL. El sufijo `T00:00:00` es redundante con
 * `parseISO` y se conserva sólo porque hace explícito que se está pidiendo la
 * medianoche local.
 */
export const getFormattedReservationDate = (dateStr?: string | null) => {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return RESERVATION_DETAIL_COPY.invalidDate;
  }

  try {
    return format(parseISO(`${dateStr}T00:00:00`), "EEEE, d 'de' MMMM yyyy", {
      locale: es,
    });
  } catch {
    return RESERVATION_DETAIL_COPY.invalidDate;
  }
};

/**
 * El horario: los tramos de `periods` si los hay, y si no el par
 * `start_time`/`end_time` de la fila.
 */
export const getFormattedReservationTime = (
  periods?: ReservationPeriod[] | null,
  startTime?: string | null,
  endTime?: string | null,
) => {
  const safePeriods = Array.isArray(periods) ? [...periods] : [];
  const sortedPeriods = safePeriods.sort((left, right) =>
    String(left?.time_from || "").localeCompare(String(right?.time_from || "")),
  );

  if (sortedPeriods.length > 0) {
    return sortedPeriods
      .map((period) => {
        const periodStart = String(period?.time_from || "00:00:00").slice(0, 5);
        const periodEnd = String(period?.time_to || "00:00:00").slice(0, 5);
        return `${periodStart} - ${periodEnd}`;
      })
      .join(" / ");
  }

  if (startTime || endTime) {
    return `${String(startTime || "00:00:00").slice(0, 5)} - ${String(
      endTime || startTime || "00:00:00",
    ).slice(0, 5)}`;
  }

  return RESERVATION_DETAIL_COPY.timeUnspecified;
};

/**
 * El precio del área, y el total cobrado cuando el área es gratuita pero la
 * reserva igual generó una deuda.
 */
export const getPriceDetails = (
  area: ReservationArea | null | undefined,
  totalAmount: string | number | undefined | null,
) => {
  const safeTotalAmount = totalAmount ?? 0;
  if (!area) return RESERVATION_DETAIL_COPY.priceUnavailable;

  const price = Number.parseFloat(String(area.price || 0));
  const total = Number.parseFloat(String(safeTotalAmount));
  const isFreeExplicit = area.is_free === true;
  const isPriceZero = Number.isNaN(price) || price <= 0;

  if (isFreeExplicit || isPriceZero) {
    return total > 0
      ? `${RESERVATION_DETAIL_COPY.free} · Total Bs ${total.toFixed(2)}`
      : RESERVATION_DETAIL_COPY.free;
  }

  return `Bs ${price.toFixed(2)}`;
};

/** "3 personas" / "1 persona". */
export const formatPeopleCount = (peopleCount?: number | null) =>
  `${peopleCount ?? 0} persona${peopleCount === 1 ? "" : "s"}`;
