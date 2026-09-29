import { MONTHS_GRAPH } from "@/mk/utils/date";

/**
 * El título del Balance para cada período de `filter_date`: los que ofrece el
 * selector de `Balance.tsx` —`m`, `lm`, `y`, `ly` y el personalizado—.
 *
 * ⚠️ `d`, `ld`, `w` y `lw` ya no tienen título: el API los rechaza con un 422
 * (`BalanceService::PERIODS`), porque respondía con las cifras del AÑO. Nadie
 * los ofrecía.
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

  switch (filterDate) {
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
