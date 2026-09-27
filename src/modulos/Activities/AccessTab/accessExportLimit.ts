/**
 * El reporte de accesos sólo se exporta con un período acotado (producción,
 * 87439942): sin período, «Este año», «Año anterior» o un rango de más de 60
 * días no sale. El listado tiene cientos de miles de filas y el export las
 * arma todas.
 *
 * ⚠️ El API NO tiene este tope: `AccesosExportConfig` acepta cualquier
 * período. Esto es sólo del admin.
 */
export const ACCESS_EXPORT_MAX_RANGE_DAYS = 60;

const BLOCKED_PERIODS = new Set(["y", "ly"]);
const DAY_MS = 86_400_000;

/** `filterBy` viaja como `clave:valor|clave:valor`. */
const readFilter = (filterBy: unknown, key: string): string => {
  for (const part of String(filterBy ?? "").split("|")) {
    const separator = part.indexOf(":");
    if (separator !== -1 && part.slice(0, separator).trim() === key) {
      return part.slice(separator + 1).trim();
    }
  }
  return "";
};

const parseIsoDate = (value: string): number | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  return match
    ? Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : null;
};

/** El motivo por el que no se exporta, o `null` si se puede. */
export const validateAccessExport = ({
  params,
}: {
  params?: Record<string, any>;
}): string | null => {
  const period = readFilter(params?.filterBy, "in_at");

  if (!period || period === "ALL") {
    return "Debe elegir un periodo para poder generar el reporte.";
  }

  if (BLOCKED_PERIODS.has(period)) {
    return `Para exportar el reporte seleccione un periodo menor a ${ACCESS_EXPORT_MAX_RANGE_DAYS} días. Este año y Año anterior no están permitidos.`;
  }

  if (!period.includes(",")) return null;

  const [start = "", end = ""] = period.split(",");
  const startTime = parseIsoDate(start);
  const endTime = parseIsoDate(end);

  if (startTime === null || endTime === null || endTime < startTime) {
    return "El rango de fechas seleccionado no es válido para exportar.";
  }

  if ((endTime - startTime) / DAY_MS > ACCESS_EXPORT_MAX_RANGE_DAYS) {
    return `El rango personalizado no puede superar ${ACCESS_EXPORT_MAX_RANGE_DAYS} días para exportar el reporte.`;
  }

  return null;
};
