import { MONTHS_GRAPH } from "@/mk/utils/date";

/**
 * El título del Balance para cada período de `filter_date`.
 *
 * 🔴 «Ayer» salía como un día de 1970: se armaba con
 * `new Date(now.getDate() - 1)`, que toma el NÚMERO del día como
 * milisegundos desde 1970. Las fechas relativas se calculan copiando `now` y
 * moviendo el día con `setDate()`, que cruza de mes y de año solo.
 *
 * Las semanas empiezan el LUNES, igual que `startOfWeek()` del API: un
 * domingo, `getDay()` es 0 y la cuenta vieja daba el lunes SIGUIENTE.
 *
 * El personalizado (`c:AAAA-MM-DD,AAAA-MM-DD`) se lee de las partes del texto,
 * sin pasar por `Date`: son días del calendario del condominio, y un `Date`
 * los corre al día anterior en cualquier navegador al oeste de la zona que se
 * escribiera a mano (acá decía `-04:00`).
 *
 * Pura a propósito: recibe `now` para poder probarla con el reloj fijo.
 */
export const balancePeriodLabel = (
  filterDate: string,
  now: Date = new Date(),
): string => {
  const months = MONTHS_GRAPH;
  const shift = (days: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    return date;
  };
  const day = (date: Date) =>
    `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
  const range = (from: Date, to: Date) =>
    `Balance desde ${from.getDate()} de ${months[from.getMonth()]} hasta ${day(to)}`;
  // Días desde el lunes: domingo (0) es el SÉPTIMO día de la semana, no el primero.
  const sinceMonday = (now.getDay() + 6) % 7;

  switch (filterDate) {
    case "d":
      return `Balance del ${day(now)}`;
    case "ld":
      return `Balance del ${day(shift(-1))}`;
    case "w":
      return range(shift(-sinceMonday), shift(6 - sinceMonday));
    case "lw":
      return range(shift(-sinceMonday - 7), shift(-sinceMonday - 1));
    case "m":
      return `Balance de ${months[now.getMonth()]} de ${now.getFullYear()}`;
    case "lm": {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return `Balance de ${months[lastMonth.getMonth()]} de ${lastMonth.getFullYear()}`;
    }
    case "y":
      return `Balance desde Enero hasta ${months[now.getMonth()]} de ${now.getFullYear()}`;
    case "ly":
      return `Balance desde Enero hasta Diciembre de ${now.getFullYear() - 1}`;
  }

  const custom = /^c:(\d{4})-(\d{2})-(\d{2}),(\d{4})-(\d{2})-(\d{2})$/.exec(
    filterDate,
  );
  if (custom) {
    const [, y1, m1, d1, y2, m2, d2] = custom.map(Number);
    return `Balance desde ${d1} de ${months[m1 - 1]} de ${y1} hasta ${d2} de ${months[m2 - 1]} de ${y2}`;
  }
  return "Balance general";
};
