import { formatToDayDDMMYYYY } from "@/mk/utils/date";
import { formatBs } from "@/mk/utils/numbers";
import { getPaymentStatusConfig, type PaymentStatus } from "@/types/payment";

export type ReportFormat = "pdf" | "excel";

export type ReportPageMode =
  | "letter-portrait"
  | "letter-landscape"
  | "legal-portrait"
  | "legal-landscape";

export type ReportColumnDefinition = {
  id: string;
  label: string;
  align?: "left" | "center" | "right";
  minWidth?: number;
  defaultWeight?: number;
  requiresDetail?: boolean;
  getValue: (row: Record<string, any>) => string;
};

export type ReportDetailFetchConfig = {
  module: string;
  enabledUpToRows: number;
  concurrency: number;
  loadingMessage?: string;
  blockedMessage: (input: { enabledUpToRows: number }) => string;
  mapDetail: (detail: Record<string, any> | null | undefined) => Record<string, any>;
};

export type ReportPreset = {
  id: string;
  title: string;
  module: string;
  dateFilterKey: string;
  defaultFormat: ReportFormat;
  defaultPageMode: ReportPageMode;
  columns: ReportColumnDefinition[];
  defaultSelectedColumns: string[];
  buildParams: (input: {
    baseParams?: Record<string, any>;
    startDate: string;
    endDate: string;
    page: number;
    perPage: number;
  }) => Record<string, any>;
  resolveRows: (response: any) => Record<string, any>[];
  resolveTotal: (response: any) => number | null;
  getFileBaseName: (input: { startDate: string; endDate: string }) => string;
  detailFetch?: ReportDetailFetchConfig | null;
};

const parseFilterBy = (filterBy: string | undefined) => {
  const next: Record<string, string> = {};

  if (!filterBy) return next;

  filterBy
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      const idx = part.indexOf(":");
      if (idx === -1) return;
      const key = part.slice(0, idx).trim();
      const value = part.slice(idx + 1).trim();
      if (!key) return;
      next[key] = value;
    });

  return next;
};

const stringifyFilterBy = (filterBy: Record<string, any>) => {
  const parts = Object.entries(filterBy)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${key}:${value}`);

  return parts.length > 0 ? parts.join("|") : undefined;
};

const getTodayIsoDate = () => new Date().toISOString().slice(0, 10);

const formatNumericDate = (value?: string | null) => {
  const formatted = formatToDayDDMMYYYY(value || "") || "";
  const [, numericPart = ""] = formatted.split(", ");
  return numericPart || formatted || "-/-";
};

export const getDefaultYearRange = () => {
  const today = new Date();
  const startDate = `${today.getFullYear()}-01-01`;
  const endDate = getTodayIsoDate();

  return { startDate, endDate };
};

export const resolveInitialDateRange = (
  preset: ReportPreset,
  baseParams?: Record<string, any>,
) => {
  const fallback = getDefaultYearRange();
  const currentFilters = parseFilterBy(String(baseParams?.filterBy || ""));
  const rawRange = currentFilters[preset.dateFilterKey];

  if (!rawRange) return fallback;

  const [startDate = "", endDate = ""] = String(rawRange).split(",");

  if (!startDate || !endDate) return fallback;

  return { startDate, endDate };
};

const MONTH_NAMES = [
  "",
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const getUniqueListText = (values: Array<string | null | undefined>) => {
  const normalized = values
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  const unique = Array.from(new Set(normalized));
  return unique.length > 0 ? unique.join(" | ") : "-/-";
};

const getPaymentDetails = (item: Record<string, any>) =>
  Array.isArray(item?.details) ? item.details : [];

const getPaymentCategoryValues = (item: Record<string, any>) => {
  const detailValues = getPaymentDetails(item).map(
    (detail: any) =>
      detail?.subcategory?.padre?.name ||
      item?.category?.padre?.name ||
      item?.category?.name,
  );

  if (detailValues.some(Boolean)) {
    return detailValues;
  }

  return [item?.category?.padre?.name || item?.category?.name];
};

const getPaymentSubcategoryValues = (item: Record<string, any>) => {
  const detailValues = getPaymentDetails(item).map(
    (detail: any) => detail?.subcategory?.name,
  );

  if (detailValues.some(Boolean)) {
    return detailValues;
  }

  return [item?.category?.name];
};

const getDebtPeriodLabel = (debt: Record<string, any> | null | undefined) => {
  if (!debt) return "";

  const rawMonth = Number(
    debt?.month ?? debt?.mes ?? debt?.period ?? debt?.periodo ?? 0,
  );
  const monthLabel =
    Number.isFinite(rawMonth) && rawMonth >= 1 && rawMonth <= 12
      ? MONTH_NAMES[rawMonth]
      : String(
          debt?.month ?? debt?.mes ?? debt?.period ?? debt?.periodo ?? "",
        ).trim();
  const yearLabel = String(
    debt?.year ?? debt?.anio ?? debt?.yr ?? debt?.y ?? "",
  ).trim();

  return [monthLabel, yearLabel].filter(Boolean).join(" ").trim();
};

const getPaymentPeriodOrConceptValues = (item: Record<string, any>) => {
  const detailValues = getPaymentDetails(item).map((detail: any) => {
    const debtPeriod = getDebtPeriodLabel(detail?.debt_dpto?.debt);
    if (debtPeriod) return debtPeriod;

    const reservationTitle =
      detail?.debt_dpto?.reservation?.area?.title ||
      detail?.debt_dpto?.reservation?.area?.name ||
      detail?.debt_dpto?.penaltyReservation?.area?.title ||
      detail?.debt_dpto?.penaltyReservation?.area?.name;
    if (reservationTitle) return reservationTitle;

    const fallbackConcept =
      detail?.debt_dpto?.description ||
      detail?.subcategory?.name ||
      item?.obs ||
      item?.concepto;

    return fallbackConcept;
  });

  if (detailValues.some(Boolean)) {
    return detailValues;
  }

  return [item?.obs || item?.concepto || item?.category?.name];
};

const getPaymentStatusLabel = (item: Record<string, any>) => {
  const status = String(item?.status || "").trim().toUpperCase() as PaymentStatus;
  if (!status) return "-/-";
  return getPaymentStatusConfig(status).longLabel || getPaymentStatusConfig(status).label;
};

const getPaymentPartialLabel = (item: Record<string, any>) => {
  if (item?.is_partial === true || item?.is_partial === 1 || item?.is_partial === "1") {
    return "Si";
  }

  if (item?.is_partial === false || item?.is_partial === 0 || item?.is_partial === "0") {
    return "No";
  }

  return "-/-";
};

const getPaymentVoucherLabel = (item: Record<string, any>) => {
  const voucher = String(item?.voucher || "").trim();
  return voucher || "-/-";
};

const getPaymentObservationLabel = (item: Record<string, any>) => {
  const obs = String(item?.obs || "").trim();
  return obs || "-/-";
};

const getPaymentCategory = (item: Record<string, any>) => {
  return getUniqueListText(getPaymentCategoryValues(item));
};

const getPaymentSubcategory = (item: Record<string, any>) => {
  return getUniqueListText(getPaymentSubcategoryValues(item));
};

const getPaymentPeriodOrConcept = (item: Record<string, any>) => {
  return getUniqueListText(getPaymentPeriodOrConceptValues(item));
};

const paymentsIncomePreset: ReportPreset = {
  id: "payments-income",
  title: "Reporte de Ingresos",
  module: "payments",
  dateFilterKey: "paid_at",
  defaultFormat: "pdf",
  defaultPageMode: "legal-landscape",
  defaultSelectedColumns: [
    "paid_at",
    "dptos",
    "category",
    "subcategory",
    "period_or_concept",
    "status",
    "voucher",
    "amount",
  ],
  columns: [
    {
      id: "paid_at",
      label: "Fecha de Pago",
      minWidth: 104,
      defaultWeight: 0.95,
      getValue: (row) => formatNumericDate(row?.paid_at),
    },
    {
      id: "dptos",
      label: "Unidad",
      minWidth: 92,
      defaultWeight: 0.92,
      getValue: (row) => String(row?.dptos || "-/-").replace(/,/g, ""),
    },
    {
      id: "category",
      label: "Categoria",
      minWidth: 120,
      defaultWeight: 1.05,
      getValue: (row) => getPaymentCategory(row),
    },
    {
      id: "subcategory",
      label: "Subcategoria",
      minWidth: 132,
      defaultWeight: 1.1,
      getValue: (row) => getPaymentSubcategory(row),
    },
    {
      id: "period_or_concept",
      label: "Concepto/Periodo",
      minWidth: 176,
      defaultWeight: 2.05,
      getValue: (row) => getPaymentPeriodOrConcept(row),
    },
    {
      id: "status",
      label: "Estado",
      minWidth: 104,
      defaultWeight: 0.95,
      getValue: (row) => getPaymentStatusLabel(row),
    },
    {
      id: "partial",
      label: "Pago parcial",
      minWidth: 108,
      defaultWeight: 0.9,
      requiresDetail: true,
      getValue: (row) => getPaymentPartialLabel(row),
    },
    {
      id: "voucher",
      label: "Nro. Pago",
      minWidth: 104,
      defaultWeight: 0.92,
      requiresDetail: true,
      getValue: (row) => getPaymentVoucherLabel(row),
    },
    {
      id: "obs",
      label: "Observaciones",
      minWidth: 148,
      defaultWeight: 1.25,
      requiresDetail: true,
      getValue: (row) => getPaymentObservationLabel(row),
    },
    {
      id: "amount",
      label: "Monto Ingreso",
      align: "right",
      minWidth: 110,
      defaultWeight: 0.95,
      getValue: (row) => formatBs(row?.amount || 0),
    },
  ],
  buildParams: ({ baseParams, startDate, endDate, page, perPage }) => {
    const nextParams = { ...(baseParams || {}) };
    const parsedFilters = parseFilterBy(String(nextParams.filterBy || ""));

    parsedFilters.paid_at = `${startDate},${endDate}`;

    delete nextParams._export;
    delete nextParams.exportCols;
    delete nextParams.exportTitulo;
    delete nextParams.exportTitulos;
    delete nextParams.exportAnchos;
    delete nextParams.cols;

    return {
      ...nextParams,
      fullType: "L",
      page,
      perPage,
      filterBy: stringifyFilterBy(parsedFilters),
    };
  },
  resolveRows: (response) =>
    Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response?.data?.data)
        ? response.data.data
        : Array.isArray(response?.data?.message?.data)
          ? response.data.message.data
          : [],
  resolveTotal: (response) => {
    const raw = response?.data?.message?.total ?? response?.data?.total;
    const total = Number(raw);
    return Number.isFinite(total) ? total : null;
  },
  getFileBaseName: ({ startDate, endDate }) =>
    `reporte-ingresos-${startDate}-a-${endDate}`,
  detailFetch: {
    module: "payments",
    enabledUpToRows: 800,
    concurrency: 6,
    loadingMessage:
      "Completando numero respaldo, observaciones y pago parcial.",
    blockedMessage: ({ enabledUpToRows }) =>
      `Pago parcial, observaciones y numero respaldo solo se completan en reportes de hasta ${enabledUpToRows} filas; en cargas masivas Laravel no expone esos campos dentro del listado paginado.`,
    mapDetail: (detail) => ({
      voucher: detail?.voucher,
      obs: detail?.obs,
      is_partial: detail?.is_partial,
    }),
  },
};

export const reportPresets: Record<string, ReportPreset> = {
  [paymentsIncomePreset.id]: paymentsIncomePreset,
};

export const getReportPreset = (presetId: string | null | undefined) =>
  (presetId ? reportPresets[presetId] : undefined) || null;
