export type UnitTypeCount = {
  id: string;
  name: string;
  value: number;
};

const AGGREGATE_UNIT_KEYS = new Set([
  "all",
  "todos",
  "total",
  "totales",
  "total_units",
  "totalunits",
  "units_total",
  "total_unidades",
  "unidades_totales",
]);

const isEmptyValue = (value: unknown) =>
  value === null || value === undefined || value === "";

const parseCount = (value: unknown): number | null => {
  if (isEmptyValue(value)) return null;

  if (Array.isArray(value)) return value.length;

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return firstCount(
      record.total,
      record.count,
      record.value,
      record.quantity,
    );
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const toCount = (value: unknown): number => parseCount(value) ?? 0;

export const firstCount = (...values: unknown[]): number | null => {
  for (const value of values) {
    const count = parseCount(value);
    if (count !== null) return count;
  }

  return null;
};

export const firstCountOrZero = (...values: unknown[]): number =>
  firstCount(...values) ?? 0;

export const isAggregateUnitKey = (key: string): boolean =>
  AGGREGATE_UNIT_KEYS.has(key.trim().toLowerCase());

const getSummaryEntries = (
  unitsSummary: unknown,
): Array<[string, unknown]> => {
  if (
    !unitsSummary ||
    typeof unitsSummary !== "object" ||
    Array.isArray(unitsSummary)
  ) {
    return [];
  }

  return Object.entries(unitsSummary as Record<string, unknown>);
};

export const getUnitTypeCounts = (unitsSummary: unknown): UnitTypeCount[] =>
  getSummaryEntries(unitsSummary)
    .filter(([key]) => !isAggregateUnitKey(key))
    .map(([key, value]) => ({
      id: key,
      name: key,
      value: toCount(value),
    }));

export const getUnitTotalCount = (
  unitsSummary: unknown,
  fallback: unknown = 0,
): number => {
  const entries = getSummaryEntries(unitsSummary);
  const aggregate = entries.find(([key]) => isAggregateUnitKey(key));

  if (aggregate) return toCount(aggregate[1]);

  if (entries.length > 0) {
    return getUnitTypeCounts(unitsSummary).reduce(
      (total, item) => total + item.value,
      0,
    );
  }

  return toCount(fallback);
};
